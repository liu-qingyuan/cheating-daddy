const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function fixture({ mode = 'mic_only', denyMicrophone = false } = {}) {
    const source = fs.readFileSync(path.join(__dirname, '../src/utils/renderer.js'), 'utf8');
    const start = source.indexOf('async function startCapture(');
    const end = source.indexOf('\nfunction setupLinuxMicProcessing(', start);
    const calls = { microphone: 0, screen: 0, setup: 0, stopped: 0, status: [] };
    const stream = { getAudioTracks: () => [{ label: 'Controlled microphone fixture' }], getVideoTracks: () => [], getTracks: () => [] };
    const context = {
        preferencesCache: { providerMode: 'subscription', subscriptionAudioMode: mode },
        loadPreferencesCache: async () => {},
        currentImageQuality: 'medium',
        isMacOS: true,
        isLinux: false,
        SAMPLE_RATE: 24000,
        mediaStream: null,
        console: { log() {}, warn() {}, error() {} },
        ipcRenderer: { invoke: async () => ({ success: true }) },
        navigator: {
            mediaDevices: {
                getDisplayMedia: () => {
                    calls.screen++;
                    return new Promise(() => {});
                },
                getUserMedia: async () => {
                    calls.microphone++;
                    if (denyMicrophone) {
                        const error = new Error('Microphone permission denied');
                        error.name = 'NotAllowedError';
                        throw error;
                    }
                    return stream;
                },
            },
        },
        setupLinuxMicProcessing: () => {
            calls.setup++;
        },
        stopCapture: () => {
            calls.stopped++;
        },
        cheatingDaddy: { setStatus: status => calls.status.push(status) },
    };
    vm.createContext(context);
    vm.runInContext(source.slice(start, end) + '\nglobalThis.capture=startCapture;', context);
    return { calls, capture: context.capture };
}

test('subscription microphone starts without requesting or waiting for screen sharing', async () => {
    const { calls, capture } = fixture();
    const result = await Promise.race([capture(), new Promise(resolve => setTimeout(() => resolve('BLOCKED'), 150))]);
    assert.equal(result, true);
    assert.equal(calls.screen, 0);
    assert.equal(calls.microphone, 1);
    assert.equal(calls.setup, 1);
    assert.match(calls.status.join(' '), /麦克风/);
});

test('microphone denial returns failure and displays the actual permission error', async () => {
    const { calls, capture } = fixture({ denyMicrophone: true });
    const result = await Promise.race([capture(), new Promise(resolve => setTimeout(() => resolve('BLOCKED'), 150))]);
    assert.equal(result, false);
    assert.equal(calls.setup, 0);
    assert.equal(calls.stopped, 1);
    assert.match(calls.status.join(' '), /NotAllowedError|permission denied/);
});

test('file-only mode explicitly says it is not recording', async () => {
    const { calls, capture } = fixture({ mode: 'files_only' });
    assert.equal(await capture(), true);
    assert.equal(calls.microphone, 0);
    assert.equal(calls.screen, 0);
    assert.match(calls.status.join(' '), /未开启麦克风/);
});
