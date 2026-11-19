const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
function fixture() {
    const calls = { events: [], languages: [], instructions: [] };
    class Engine {
        async start() {
            this.ready = true;
        }
        stop() {}
        async transcribe(wav, language) {
            calls.languages.push(language);
            return 'Explain binary search.';
        }
        async answer(text, options) {
            calls.instructions.push(options.instructions);
            return '二分查找的时间复杂度是 O(log n)。';
        }
    }
    const context = {
        module: { exports: {} },
        Buffer,
        Date,
        Map,
        Promise,
        require(name) {
            if (name === './subscription-core') return { SubscriptionEngine: Engine, pcm24kToWav: b => b };
            if (name === './gemini') return { sendToRenderer: (...e) => calls.events.push(e), initializeNewSession() {}, saveConversationTurn() {} };
            if (name === './prompts') return { getSystemPrompt: () => '' };
            throw Error(name);
        },
    };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/utils/subscription.js'), 'utf8'), context);
    return { api: context.module.exports, calls };
}
test('subscription forwards ASR language and applies selected answer language', async () => {
    const { api, calls } = fixture();
    await api.initializeLocalSession({ asrLanguage: 'English', answerLanguage: 'cmn-CN' }, null, 'interview', '');
    await api.transcribeWav(Buffer.alloc(48000), true);
    assert.equal(calls.languages[0], 'English');
    assert.match(calls.instructions[0], /Simplified Chinese/);
    api.closeLocalSession();
});
test('live microphone transcription retains its source and can be manually submitted', async () => {
    const { api, calls } = fixture();
    await api.initializeLocalSession({}, null, 'interview', '');
    const pcm = Buffer.alloc(48000);
    for (let i = 0; i < pcm.length; i += 2) pcm.writeInt16LE(2000, i);
    api.processLocalAudio(pcm, 'mic');
    assert.equal(typeof api.flushLocalAudio, 'function');
    const result = await api.flushLocalAudio();
    assert.equal(result.success, true);
    const transcript = calls.events.find(e => e[0] === 'subscription-transcript')[1];
    assert.equal(transcript.source, 'mic');
    assert.equal(transcript.text, 'Explain binary search.');
    assert.ok(calls.events.find(e => e[0] === 'subscription-audio-level'));
    const empty = await api.flushLocalAudio();
    assert.equal(empty.success, false);
    api.closeLocalSession();
});
test('automatic pause submits system audio with its source rather than labelling it as me', async () => {
    const { api, calls } = fixture();
    await api.initializeLocalSession({}, null, 'interview', '');
    const pcm = Buffer.alloc(48000);
    for (let i = 0; i < pcm.length; i += 2) pcm.writeInt16LE(2000, i);
    api.processLocalAudio(pcm, 'system');
    api.processLocalAudio(Buffer.alloc(48000), 'system');
    await new Promise(r => setTimeout(r, 10));
    assert.equal(calls.events.find(e => e[0] === 'subscription-transcript')[1].source, 'system');
    assert.equal(calls.languages[0], 'auto');
    api.closeLocalSession();
});
