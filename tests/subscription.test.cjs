const { test } = require('node:test');
const assert = require('node:assert/strict');
const { pcm24kToWav, SubscriptionEngine } = require('../src/utils/subscription-core');

test('24 kHz PCM is converted to valid mono 16 kHz WAV', () => {
    const pcm = Buffer.alloc(48000);
    for (let i = 0; i < 24000; i++) pcm.writeInt16LE(Math.round(Math.sin(i / 10) * 12000), i * 2);
    const wav = pcm24kToWav(pcm);
    assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
    assert.equal(wav.readUInt32LE(24), 16000);
    assert.equal(wav.readUInt32LE(40), 32000);
    assert.equal(wav.length, 32044);
});

test('unconfigured model fails explicitly rather than downloading or calling an API', async () => {
    const engine = new SubscriptionEngine({ modelDirectory: '/missing/local-asr-model' });
    await assert.rejects(engine.start(), /model|模型/i);
    engine.stop();
});

test('closed engine does not send an audio recording', async () => {
    const engine = new SubscriptionEngine();
    await assert.rejects(engine.transcribe(Buffer.alloc(44)), /start|启动/i);
});

test('invalid model path types fail clearly before accessing files', async () => {
    const engine = new SubscriptionEngine({ modelDirectory: 42 });
    await assert.rejects(engine.start(), /绝对路径/);
});
