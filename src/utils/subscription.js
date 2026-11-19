const { SubscriptionEngine, pcm24kToWav } = require('./subscription-core');
const { sendToRenderer, initializeNewSession, saveConversationTurn } = require('./gemini');
const { getSystemPrompt } = require('./prompts');

let engine = null;
let instructions = '';
let asrLanguage = 'auto';
const lastLevelAt = new Map();
let queue = Promise.resolve();
let pending = 0;
const segments = new Map();

async function initializeLocalSession(options, unused, profile, customPrompt) {
    closeLocalSession();
    const current = new SubscriptionEngine({ ...options, onStatus: message => sendToRenderer('update-status', message) });
    engine = current;
    const answerLanguage = typeof options?.answerLanguage === 'string' && options.answerLanguage ? options.answerLanguage : 'cmn-CN';
    const languageName =
        answerLanguage === 'cmn-CN' || answerLanguage === 'zh-CN'
            ? 'Simplified Chinese'
            : answerLanguage.startsWith('en')
              ? 'English'
              : answerLanguage;
    instructions =
        getSystemPrompt(profile, customPrompt, false) +
        '\n' +
        (answerLanguage === 'auto'
            ? 'Answer in the language of the question.'
            : `Respond in ${languageName}. This is the user's explicit answer-language preference, including for questions in another language.`);
    asrLanguage = ['auto', 'Chinese', 'English'].includes(options?.asrLanguage) ? options.asrLanguage : 'auto';
    sendToRenderer('session-initializing', true);
    try {
        await current.start();
        if (engine !== current) return false;
        initializeNewSession(profile, customPrompt);
        return true;
    } catch (error) {
        sendToRenderer('update-status', error.message);
        if (engine === current) closeLocalSession();
        return false;
    } finally {
        sendToRenderer('session-initializing', false);
    }
}

function closeLocalSession() {
    engine?.stop();
    engine = null;
    segments.clear();
    lastLevelAt.clear();
    pending = 0;
    queue = Promise.resolve();
}

function enqueue(operation) {
    const current = engine;
    if (!current?.ready) return Promise.resolve({ success: false, error: '请先启动本地语音 + GPT 订阅会话。' });
    if (pending >= 3) {
        const error = '正在处理前面的题目，请稍后重试。';
        sendToRenderer('update-status', error);
        return Promise.resolve({ success: false, error });
    }
    pending++;
    const task = queue.then(async () => {
        if (engine !== current) return { success: false, error: '会话已关闭。' };
        try {
            return await operation(current);
        } catch (error) {
            if (engine === current) sendToRenderer('update-status', error.message);
            return { success: false, error: error.message };
        } finally {
            if (engine === current) pending--;
        }
    });
    queue = task.catch(() => {});
    return task;
}

async function answer(current, text, image, source = 'text') {
    sendToRenderer('update-status', 'GPT 订阅正在解题…');
    const result = await current.answer(text, { image, instructions });
    if (engine !== current) return { success: false, error: '会话已关闭。' };
    sendToRenderer('subscription-answer-context', { source, question: text });
    sendToRenderer('new-response', result);
    saveConversationTurn(text, result, source);
    sendToRenderer('update-status', '本地 ASR + GPT 订阅已就绪');
    return { success: true, text: result, model: 'ChatGPT subscription / Codex' };
}

function sendLocalText(text) {
    return enqueue(current => {
        sendToRenderer('subscription-transcript', { text, source: 'text' });
        return answer(current, text);
    });
}

function sendLocalImage(data, prompt) {
    return enqueue(current =>
        answer(current, prompt || '请分析截图中的题目，给出解题思路、完整答案或代码，以及时间和空间复杂度。', Buffer.from(data, 'base64'), 'image')
    );
}

function transcribeWav(wav, ask = false, source = 'file') {
    return enqueue(async current => {
        sendToRenderer('update-status', '本地识别中英文语音…');
        const transcript = await current.transcribe(wav, asrLanguage);
        if (engine !== current) return { success: false, error: '会话已关闭。' };
        if (!transcript) {
            const error = '没有识别到语音，请靠近麦克风重试，或点击“提交刚才语音”。';
            sendToRenderer('update-status', error);
            return { success: false, error };
        }
        sendToRenderer('subscription-transcript', { text: transcript, source });
        if (ask) return { ...(await answer(current, transcript, undefined, source)), transcript };
        sendToRenderer('update-status', '本地转写完成');
        return { success: true, transcript };
    });
}

function processLocalAudio(pcm, source = 'system') {
    if (!engine?.ready || !Buffer.isBuffer(pcm) || pcm.length % 2) return;
    let state = segments.get(source);
    if (!state) {
        state = { chunks: [], bytes: 0, silentMs: 0, voiceMs: 0 };
        segments.set(source, state);
    }
    let energy = 0;
    for (let i = 0; i < pcm.length; i += 2) energy += (pcm.readInt16LE(i) / 32768) ** 2;
    const rms = Math.sqrt(energy / (pcm.length / 2 || 1));
    const now = Date.now();
    if (now - (lastLevelAt.get(source) || 0) >= 250) {
        lastLevelAt.set(source, now);
        sendToRenderer('subscription-audio-level', { source, rms });
    }
    const voiced = rms > 0.008;
    const duration = pcm.length / 48;
    if (voiced || state.bytes) {
        if (voiced && state.bytes === 0)
            sendToRenderer('update-status', source === 'mic' ? '听到麦克风语音，请说完后停顿约 1 秒…' : '听到系统声音，等待停顿后识别…');
        state.chunks.push(pcm);
        state.bytes += pcm.length;
        if (voiced) {
            state.voiceMs += duration;
            state.silentMs = 0;
        } else state.silentMs += duration;
        if (state.silentMs >= 900 || state.bytes >= 48000 * 20) {
            if (state.voiceMs >= 250) void transcribeWav(pcm24kToWav(Buffer.concat(state.chunks)), true, source);
            segments.delete(source);
        }
    }
}

function flushLocalAudio() {
    const tasks = [];
    for (const [source, state] of segments) {
        segments.delete(source);
        if (state.voiceMs >= 250) tasks.push(transcribeWav(pcm24kToWav(Buffer.concat(state.chunks)), true, source));
    }
    if (!tasks.length) {
        const error = '未收到足够语音；若已自动提交，请等待转写和回答。请检查音源与输入电平。';
        sendToRenderer('update-status', error);
        return Promise.resolve({ success: false, error });
    }
    return Promise.all(tasks).then(results => results.find(result => !result.success) || { success: true });
}

module.exports = {
    flushLocalAudio,
    initializeLocalSession,
    closeLocalSession,
    processLocalAudio,
    sendLocalText,
    sendLocalImage,
    transcribeWav,
    isLocalSessionActive: () => !!engine?.ready,
    cancelLocalInitialization: async () => {
        closeLocalSession();
        return true;
    },
};
