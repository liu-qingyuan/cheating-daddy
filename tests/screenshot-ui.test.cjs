const { test } = require('node:test'),
    assert = require('node:assert/strict'),
    fs = require('node:fs'),
    vm = require('node:vm'),
    path = require('node:path');
test('screen capture failure always releases the analyzing button', async () => {
    const source = fs.readFileSync(path.join(__dirname, '../src/components/views/AssistantView.js'), 'utf8');
    const start = source.indexOf('    async handleScreenAnswer()'),
        end = source.indexOf('    _startWaveformAnimation()', start);
    const statuses = [];
    const context = {
        window: { captureManualScreenshot: async () => ({ success: false, error: '屏幕录制权限未开启' }) },
        cheatingDaddy: { setStatus: s => statuses.push(s) },
    };
    vm.runInNewContext('this.view={isAnalyzing:false,responses:[],t:s=>s,' + source.slice(start, end).trim() + '}', context);
    await context.view.handleScreenAnswer();
    assert.equal(context.view.isAnalyzing, false);
    assert.ok(statuses.some(s => s.includes('屏幕录制权限')));
});
