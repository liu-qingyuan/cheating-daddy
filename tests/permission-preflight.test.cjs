const { test } = require('node:test');
const assert = require('node:assert/strict');
const setup = require('../src/utils/media-permissions');
function fixture(microphone = 'denied', screen = 'denied', mode = 'mic_only') {
    const handlers = new Map(),
        opened = [],
        webContents = {};
    let statuses = { microphone, screen };
    setup({
        ipcMain: { handle: (channel, fn) => handlers.set(channel, fn) },
        mainWindow: { webContents },
        storage: { getPreferences: () => ({ providerMode: 'subscription', subscriptionAudioMode: mode }) },
        systemPreferences: { getMediaAccessStatus: type => statuses[type] },
        shell: { openExternal: async url => opened.push(url) },
        platform: 'darwin',
        systemVersion: '27.0.1',
    });
    return {
        handlers,
        opened,
        event: { sender: webContents },
        set: (type, status) => {
            statuses[type] = status;
        },
    };
}
test('preflight blocks required microphone access, keeps optional screen separate and opens only its settings', async () => {
    const f = fixture();
    assert.equal(typeof f.handlers.get('media-permissions'), 'function', 'permission snapshot IPC must exist');
    let state = await f.handlers.get('media-permissions')(f.event);
    assert.equal(state.readyToStart, false);
    assert.equal(state.microphoneRequired, true);
    assert.equal(state.screenRequired, false);
    f.set('microphone', 'granted');
    state = await f.handlers.get('media-permissions')(f.event);
    assert.equal(state.readyToStart, true);
    assert.equal(state.screen, 'denied');
    const result = await f.handlers.get('open-media-settings')(f.event, 'screen');
    assert.equal(result.success, true);
    assert.deepEqual(f.opened, ['x-apple.systempreferences:com.apple.settings.PrivacySecurity.extension?Privacy_ScreenCapture']);
});

test('system audio requires screen access while files-only needs neither permission', async () => {
    for (const [mode, ready] of [
        ['both', false],
        ['speaker_only', false],
        ['files_only', true],
    ]) {
        const f = fixture('denied', 'denied', mode);
        const state = await f.handlers.get('media-permissions')(f.event);
        assert.equal(state.readyToStart, ready, mode);
    }
    const f = fixture('granted', 'granted', 'both');
    assert.equal((await f.handlers.get('media-permissions')(f.event)).readyToStart, true);
});
test('settings rejects untrusted senders and arbitrary destinations', async () => {
    const f = fixture();
    for (const [event, type] of [
        [{ sender: {} }, 'screen'],
        [f.event, 'camera'],
        [f.event, 'https://example.com'],
        [f.event, '__proto__'],
    ]) {
        assert.equal((await f.handlers.get('open-media-settings')(event, type)).success, false);
    }
    assert.equal(f.opened.length, 0);
    assert.equal((await f.handlers.get('media-permissions')({ sender: {} })).readyToStart, false);
    await f.handlers.get('open-media-settings')(f.event, 'microphone');
    assert.deepEqual(f.opened, ['x-apple.systempreferences:com.apple.settings.PrivacySecurity.extension?Privacy_Microphone']);
});
test('unknown, restricted and unrequested required access are not presented as granted', async () => {
    for (const status of ['unknown', 'restricted', 'not-determined']) {
        const f = fixture(status, 'granted');
        const state = await f.handlers.get('media-permissions')(f.event);
        assert.equal(state.microphone, status);
        assert.equal(state.readyToStart, false);
    }
});
