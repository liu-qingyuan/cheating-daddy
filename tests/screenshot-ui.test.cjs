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

test('Cmd+Enter uses the screenshot button lifecycle and retains permission errors', async () => {
    const renderer = fs.readFileSync(path.join(__dirname, '../src/utils/renderer.js'), 'utf8');
    const start = renderer.indexOf('function handleShortcut(');
    const end = renderer.indexOf('// Create reference to the main app element', start);
    const source = fs.readFileSync(path.join(__dirname, '../src/components/views/AssistantView.js'), 'utf8');
    const methodStart = source.indexOf('    async handleScreenAnswer()');
    const methodEnd = source.indexOf('    _startWaveformAnimation()', methodStart);
    let finish,
        captures = 0;
    const statuses = [];
    const capture = () => {
        captures++;
        return new Promise(resolve => {
            finish = resolve;
        });
    };
    const context = {
        window: { captureManualScreenshot: capture },
        captureManualScreenshot: capture,
        cheatingDaddy: {
            getCurrentView: () => 'assistant',
            element: () => ({ shadowRoot: { querySelector: () => context.view } }),
            setStatus: text => statuses.push(text),
        },
    };
    vm.runInNewContext(
        'this.view={isAnalyzing:false,screenshotError:"",responses:[],t:s=>s,' + source.slice(methodStart, methodEnd).trim() + '}',
        context
    );
    vm.runInNewContext(renderer.slice(start, end) + ';this.shortcut=handleShortcut;', context);
    const pending = context.shortcut('cmd+enter');
    assert.equal(context.view.isAnalyzing, true, 'shortcut must show the same busy state as the button');
    await context.shortcut('cmd+enter');
    assert.equal(captures, 1, 'repeated shortcut must not start overlapping screenshots');
    finish({ success: false, error: '屏幕录制权限未开启' });
    await pending;
    assert.equal(context.view.isAnalyzing, false);
    assert.equal(context.view.screenshotError, '屏幕录制权限未开启');
    assert.ok(statuses.includes('屏幕录制权限未开启'));
    context.cheatingDaddy.setStatus('正在自动转写');
    assert.equal(context.view.screenshotError, '屏幕录制权限未开启', 'voice status cannot erase screenshot failure');
});

test('an unrelated voice answer cannot release an in-flight screenshot', () => {
    const source = fs.readFileSync(path.join(__dirname, '../src/components/views/AssistantView.js'), 'utf8');
    const start = source.indexOf('    updated(changedProperties)'),
        end = source.indexOf('    updateResponseContent()', start);
    const context = { Map };
    vm.runInNewContext('this.View=class extends class {updated(){}} {' + source.slice(start, end) + '}', context);
    const view = Object.assign(new context.View(), {
        isAnalyzing: true,
        responses: ['VOICE_ANSWER'],
        _responseCountWhenStarted: 0,
        updateResponseContent() {},
    });
    view.updated(new Map([['responses', []]]));
    assert.equal(view.isAnalyzing, true, 'only screenshot completion may release screenshot busy state');
});
