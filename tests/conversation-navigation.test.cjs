const { test } = require('node:test'),
    assert = require('node:assert/strict'),
    fs = require('node:fs'),
    vm = require('node:vm'),
    path = require('node:path');
test('the default answer view follows new content to the bottom', () => {
    const source = fs.readFileSync(path.join(__dirname, '../src/components/views/AssistantView.js'), 'utf8');
    const start = source.indexOf('    updateResponseContent()'),
        end = source.indexOf('    async handleQuestionFile', start);
    const container = { innerHTML: '', scrollTop: 0, scrollHeight: 1800, clientHeight: 300 };
    const context = { CustomEvent: class {}, document: {}, window: {} };
    vm.runInNewContext('this.methods={' + source.slice(start, end).trim() + '}', context);
    const view = {
        followLatest: true,
        showHistory: false,
        shadowRoot: { querySelector: () => container },
        getCurrentResponse: () => 'new answer',
        renderMarkdown: s => s,
        shouldAnimateResponse: false,
    };
    context.methods.updateResponseContent.call(view);
    assert.equal(container.scrollTop, container.scrollHeight);
});
test('reading older answers preserves scroll position instead of jumping to new content', () => {
    const source = fs.readFileSync(path.join(__dirname, '../src/components/views/AssistantView.js'), 'utf8');
    const start = source.indexOf('    updateResponseContent()'),
        end = source.indexOf('    async handleQuestionFile', start);
    const container = { innerHTML: '', scrollTop: 250, scrollHeight: 1800, clientHeight: 300 };
    const context = {};
    vm.runInNewContext('this.methods={' + source.slice(start, end).trim() + '}', context);
    context.methods.updateResponseContent.call({
        followLatest: false,
        showHistory: false,
        shadowRoot: { querySelector: () => container },
        getCurrentResponse: () => 'updated answer',
        renderMarkdown: s => s,
        shouldAnimateResponse: false,
    });
    assert.equal(container.scrollTop, 250);
});
