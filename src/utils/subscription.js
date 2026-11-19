const { SubscriptionEngine, pcm24kToWav } = require('./subscription-core');
const { sendToRenderer, initializeNewSession, saveConversationTurn } = require('./gemini');
const { getSystemPrompt } = require('./prompts');

let engine = null;
let instructions = '';
let queue = Promise.resolve();
let pending = 0;
const segments = new Map();

async function initializeLocalSession(options, unused, profile, customPrompt) {
    closeLocalSession();
    const current = new SubscriptionEngine({ ...options, onStatus: message => sendToRenderer('update-status', message) });
    engine = current;
    instructions = getSystemPrompt(profile, customPrompt, false);
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
    pending = 0;
    queue = Promise.resolve();
}

function enqueue(operation) {
    const current = engine;
    if (!current?.ready) return Promise.resolve({ success: false, error: '请先启动本地语音 + GPT 订阅会话。' });
    if (pending >= 3) return Promise.resolve({ success: false, error: '正在处理前面的题目，请稍后重试。' });
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

async function answer(current, text, image) {
    sendToRenderer('update-status', 'GPT 订阅正在解题…');
    const result = await current.answer(text, { image, instructions });
    if (engine !== current) return { success: false, error: '会话已关闭。' };
    sendToRenderer('new-response', result);
    saveConversationTurn(text, result);
    sendToRenderer('update-status', '本地 ASR + GPT 订阅已就绪');
    return { success: true, text: result, model: 'ChatGPT subscription / Codex' };
}

function sendLocalText(text) {
    return enqueue(current => answer(current, text));
}

function sendLocalImage(data, prompt) {
    return enqueue(current =>
        answer(current, prompt || '请分析截图中的题目，给出解题思路、完整答案或代码，以及时间和空间复杂度。', Buffer.from(data, 'base64'))
    );
}

function transcribeWav(wav, ask = false) {
    return enqueue(async current => {
        sendToRenderer('update-status', '本地识别中英文语音…');
        const transcript = await current.transcribe(wav);
        if (engine !== current) return { success: false, error: '会话已关闭。' };
        sendToRenderer('subscription-transcript', transcript);
        if (!transcript) return { success: false, error: '没有识别到语音。' };
        if (ask) return { ...(await answer(current, transcript)), transcript };
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
    const voiced = Math.sqrt(energy / (pcm.length / 2 || 1)) > 0.008;
    const duration = pcm.length / 48;
    if (voiced || state.bytes) {
        state.chunks.push(pcm);
        state.bytes += pcm.length;
        if (voiced) {
            state.voiceMs += duration;
            state.silentMs = 0;
        } else state.silentMs += duration;
        if (state.silentMs >= 900 || state.bytes >= 48000 * 20) {
            if (state.voiceMs >= 250) void transcribeWav(pcm24kToWav(Buffer.concat(state.chunks)), true);
            segments.delete(source);
        }
    }
}

module.exports = {
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
