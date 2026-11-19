// Read-only permission preflight. Opening settings never changes an OS grant.
module.exports = function setupMediaPermissionHandlers({ ipcMain, mainWindow, storage, systemPreferences, shell, platform, systemVersion }) {
    const trusted = event => event.sender === mainWindow.webContents;
    ipcMain.handle('media-permissions', event => {
        if (!trusted(event)) return { readyToStart: false, error: '无权读取权限状态。' };
        const prefs = storage.getPreferences();
        const mode = prefs.providerMode === 'subscription' ? prefs.subscriptionAudioMode || 'files_only' : prefs.audioMode || 'speaker_only';
        const microphoneRequired = mode === 'mic_only' || mode === 'both';
        const screenRequired = mode === 'speaker_only' || mode === 'both';
        const status = type => {
            if (platform !== 'darwin') return 'not-checked';
            try {
                return systemPreferences.getMediaAccessStatus(type);
            } catch {
                return 'unknown';
            }
        };
        const microphone = status('microphone'),
            screen = status('screen');
        return {
            microphone,
            screen,
            microphoneRequired,
            screenRequired,
            readyToStart: platform !== 'darwin' || ((!microphoneRequired || microphone === 'granted') && (!screenRequired || screen === 'granted')),
        };
    });
    ipcMain.handle('open-media-settings', async (event, type) => {
        if (!trusted(event) || !['microphone', 'screen'].includes(type) || platform !== 'darwin')
            return { success: false, error: '不支持的权限设置请求。' };
        const pane = Number.parseInt(systemVersion, 10) >= 13 ? 'com.apple.settings.PrivacySecurity.extension' : 'com.apple.preference.security';
        const anchor = type === 'microphone' ? 'Privacy_Microphone' : 'Privacy_ScreenCapture';
        try {
            await shell.openExternal(`x-apple.systempreferences:${pane}?${anchor}`);
            return { success: true };
        } catch (error) {
            return { success: false, error: '无法打开系统设置：' + error.message };
        }
    });
};
