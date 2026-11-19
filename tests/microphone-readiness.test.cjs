const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
function fixture() {
    const source = fs.readFileSync(path.join(__dirname, '../src/utils/renderer.js'), 'utf8');
    const start = source.search(/(?:async )?function setupLinuxMicProcessing\(/);
    const end = source.indexOf('\nfunction setupLinuxSystemAudioProcessing', start);
    const processors = [],
        events = [],
        contexts = [];
    class Context {
        constructor() {
            this.state = 'suspended';
            contexts.push(this);
            this.destination = {};
        }
        createMediaStreamSource() {
            return { connect() {}, disconnect() {} };
        }
        createScriptProcessor() {
            const p = { connect() {}, disconnect() {} };
            processors.push(p);
            return p;
        }
        async resume() {
            this.resumed = true;
            this.state = 'running';
        }
        async close() {
            this.state = 'closed';
        }
    }
    const context = {
        AudioContext: Context,
        CustomEvent: class {
            constructor(type, options) {
                this.type = type;
                this.detail = options.detail;
            }
        },
        window: { dispatchEvent: e => events.push(e) },
        Date,
        setTimeout,
        clearTimeout,
        setInterval,
        clearInterval,
        SAMPLE_RATE: 24000,
        BUFFER_SIZE: 4096,
        AUDIO_CHUNK_DURATION: 0.1,
        microphoneStream: null,
        microphoneAudioContext: null,
        microphoneAudioSource: null,
        micAudioProcessor: null,
        microphoneCaptureWatchdog: null,
        microphoneCaptureGeneration: 0,
        console,
        cheatingDaddy: { setStatus() {} },
        ipcRenderer: { invoke: async () => ({ success: true }) },
        convertFloat32ToInt16: arr => new Int16Array(arr.length),
        arrayBufferToBase64: () => '',
    };
    vm.createContext(context);
    vm.runInContext(
        source.slice(start, end) + '\nthis.setup=setupLinuxMicProcessing;this.reconnect=reconnectMicrophone;this.stop=stopMicrophoneCapture',
        context
    );
    const stream = { getAudioTracks: () => [{ label: 'Test microphone', readyState: 'live', muted: false, enabled: true }], getTracks: () => [] };
    return {
        context,
        processors,
        events,
        contexts,
        stream,
        cleanup() {
            clearInterval(context.microphoneCaptureWatchdog);
        },
    };
}
test('microphone is explicitly resumed and not ready until its first actual audio callback', async () => {
    const f = fixture();
    try {
        let ready = false;
        const operation = Promise.resolve(f.context.setup(f.stream)).then(() => {
            ready = true;
        });
        await new Promise(r => setTimeout(r, 20));
        assert.equal(ready, false, 'permission/graph creation alone must not announce connected');
        assert.equal(f.contexts[0].resumed, true, 'resume must be requested explicitly');
        f.processors[0].onaudioprocess({ inputBuffer: { getChannelData: () => new Float32Array(4096) } });
        await operation;
        assert.equal(ready, true);
        assert.ok(f.events.some(e => e.type === 'microphone-capture-state' && e.detail.state === 'running'));
    } finally {
        f.cleanup();
    }
});
test('stalled startup is rebuilt once and then fails visibly instead of reporting ready', async () => {
    const f = fixture();
    try {
        await assert.rejects(f.context.setup(f.stream), /未产生音频回调/);
        assert.equal(f.contexts.length, 2);
        assert.ok(f.contexts.every(c => c.state === 'closed'));
        assert.ok(f.events.some(e => e.detail.state === 'error'));
    } finally {
        f.cleanup();
    }
});
test('explicit input selection is passed exactly to getUserMedia', async () => {
    const source = fs.readFileSync(path.join(__dirname, '../src/utils/renderer.js'), 'utf8');
    const start = source.indexOf('function requestMicrophone('),
        end = source.indexOf('\nfunction stopMicrophoneCapture(', start);
    let options;
    const context = {
        preferencesCache: { microphoneDeviceId: 'chosen-headset' },
        SAMPLE_RATE: 24000,
        navigator: {
            mediaDevices: {
                getUserMedia: async value => {
                    options = value;
                    return 'stream';
                },
            },
        },
    };
    vm.runInNewContext(source.slice(start, end) + '\nthis.request=requestMicrophone', context);
    assert.equal(await context.request(), 'stream');
    assert.equal(options.audio.deviceId.exact, 'chosen-headset');
    assert.equal(options.video, false);
});
test('ending capture while a reconnect device request is pending stops the late stream', async () => {
    const f = fixture();
    let resolveDevice;
    let stopped = 0;
    const track = {
        label: 'Late microphone',
        readyState: 'live',
        stop() {
            stopped++;
            this.readyState = 'ended';
        },
    };
    const stream = { getAudioTracks: () => [track], getTracks: () => [track] };
    f.context.preferencesCache = {};
    f.context.loadPreferencesCache = async () => {};
    f.context.navigator = {
        mediaDevices: {
            getUserMedia: () =>
                new Promise(r => {
                    resolveDevice = r;
                }),
        },
    };
    try {
        const op = f.context.reconnect();
        await new Promise(r => setTimeout(r, 5));
        f.context.stop();
        resolveDevice(stream);
        await new Promise(r => setTimeout(r, 10));
        // If an obsolete request incorrectly builds a graph, let it produce its first frame.
        if (f.processors[0]?.onaudioprocess) f.processors[0].onaudioprocess({ inputBuffer: { getChannelData: () => new Float32Array(4096) } });
        const result = await op;
        assert.equal(result, false, 'late reconnect must remain cancelled');
        assert.equal(stopped, 1);
        assert.equal(track.readyState, 'ended');
        assert.equal(f.context.microphoneStream, null);
        assert.equal(f.contexts.length, 0);
    } finally {
        f.context.stop();
        f.cleanup();
    }
});
test('subscription raw opt-in disables browser communications DSP', async () => {
    const source = fs.readFileSync(path.join(__dirname, '../src/utils/renderer.js'), 'utf8');
    const start = source.indexOf('function requestMicrophone('),
        end = source.indexOf('\nfunction stopMicrophoneCapture(', start);
    let options;
    const context = {
        preferencesCache: { providerMode: 'subscription', microphoneProcessing: 'raw' },
        SAMPLE_RATE: 24000,
        navigator: {
            mediaDevices: {
                getUserMedia: async value => {
                    options = value;
                    return 'stream';
                },
            },
        },
    };
    vm.runInNewContext(source.slice(start, end) + '\nthis.request=requestMicrophone', context);
    await context.request();
    assert.equal(options.audio.echoCancellation, false);
    assert.equal(options.audio.noiseSuppression, false);
    assert.equal(options.audio.autoGainControl, false);
});
test('known communications capture is the default; raw remains explicit and other providers are unchanged', async () => {
    const source = fs.readFileSync(path.join(__dirname, '../src/utils/renderer.js'), 'utf8');
    const start = source.indexOf('function requestMicrophone('),
        end = source.indexOf('\nfunction stopMicrophoneCapture(', start);
    for (const prefs of [
        { providerMode: 'subscription', microphoneProcessing: 'communications' },
        { providerMode: 'subscription' },
        { providerMode: 'byok' },
    ]) {
        let options;
        const context = {
            preferencesCache: prefs,
            SAMPLE_RATE: 24000,
            navigator: {
                mediaDevices: {
                    getUserMedia: async value => {
                        options = value;
                    },
                },
            },
        };
        vm.runInNewContext(source.slice(start, end) + '\nthis.request=requestMicrophone', context);
        await context.request();
        assert.equal(options.audio.echoCancellation, true);
        assert.equal(options.audio.noiseSuppression, true);
        assert.equal(options.audio.autoGainControl, true);
    }
});
test('numeric diagnostic snapshot accepts only this renderer and excludes audio or question payloads', async () => {
    const os = require('node:os');
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'cd-microphone-'));
    try {
        const source = fs.readFileSync(path.join(__dirname, '../src/index.js'), 'utf8');
        const start = source.indexOf('function setupGeneralIpcHandlers()');
        const handlers = new Map();
        const sender = {};
        const context = {
            mainWindow: { webContents: sender },
            ipcMain: { handle: (name, fn) => handlers.set(name, fn), on() {} },
            storage: { getConfigDir: () => directory },
            require: name => (name === 'electron' ? { systemPreferences: { getMediaAccessStatus: () => 'granted' } } : require(name)),
            process,
            Date,
            Promise,
            Number,
        };
        vm.runInNewContext(source.slice(start) + '\nsetupGeneralIpcHandlers()', context);
        const handle = handlers.get('microphone-diagnostics');
        assert.equal((await handle({ sender: {} }, { state: 'running' })).success, false);
        await handle(
            { sender },
            {
                state: 'running',
                rms: 0.01,
                peakRms: 0.03,
                frames: 12,
                samples: 49152,
                audio: 'NOT_TO_STORE',
                transcript: 'NOT_TO_STORE',
                destination: '/tmp/not-allowed',
            }
        );
        const contents = fs.readFileSync(path.join(directory, 'microphone-capture.json'), 'utf8'),
            saved = JSON.parse(contents);
        assert.equal(saved.frames, 12);
        assert.equal(saved.rms, 0.01);
        assert.equal(saved.peakRms, 0.03);
        assert.ok(!contents.includes('NOT_TO_STORE'));
        assert.equal(saved.destination, undefined);
    } finally {
        fs.rmSync(directory, { recursive: true, force: true });
    }
});
test('normal macOS microphone denial is visible before creating a silent stream', async () => {
    const source = fs.readFileSync(path.join(__dirname, '../src/utils/renderer.js'), 'utf8');
    const start = source.indexOf('function requestMicrophone('),
        end = source.indexOf('\nfunction stopMicrophoneCapture(', start);
    let acquired = false;
    const context = {
        preferencesCache: { providerMode: 'subscription' },
        SAMPLE_RATE: 24000,
        isMacOS: true,
        ipcRenderer: { invoke: async () => ({ status: 'denied' }) },
        navigator: {
            mediaDevices: {
                getUserMedia: async () => {
                    acquired = true;
                },
            },
        },
    };
    vm.runInNewContext(source.slice(start, end) + '\nthis.request=requestMicrophone', context);
    await assert.rejects(context.request(), /macOS 未授权/);
    assert.equal(acquired, false);
});
