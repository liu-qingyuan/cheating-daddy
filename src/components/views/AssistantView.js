import { LocalizedElement } from '../../utils/localized-element.js';
import { html, css } from '../../assets/lit-core-2.7.4.min.js';

export class AssistantView extends LocalizedElement {
    static styles = css`
        :host {
            height: 100%;
            display: flex;
            flex-direction: column;
        }

        * {
            font-family: var(--font);
            cursor: default;
        }

        /* ── Response area ── */

        .response-container {
            flex: 1;
            overflow-y: auto;
            font-size: var(--response-font-size, 15px);
            line-height: var(--line-height);
            background: var(--bg-app);
            padding: var(--space-sm) var(--space-md);
            scroll-behavior: auto;
            user-select: text;
            cursor: text;
            color: var(--text-primary);
        }

        .response-container * {
            user-select: text;
            cursor: text;
        }

        .response-container a {
            cursor: pointer;
        }

        .response-container [data-word] {
            display: inline-block;
        }

        /* ── Markdown ── */

        .response-container h1,
        .response-container h2,
        .response-container h3,
        .response-container h4,
        .response-container h5,
        .response-container h6 {
            margin: 1em 0 0.5em 0;
            color: var(--text-primary);
            font-weight: var(--font-weight-semibold);
        }

        .response-container h1 {
            font-size: 1.5em;
        }
        .response-container h2 {
            font-size: 1.3em;
        }
        .response-container h3 {
            font-size: 1.15em;
        }
        .response-container h4 {
            font-size: 1.05em;
        }
        .response-container h5,
        .response-container h6 {
            font-size: 1em;
        }

        .response-container p {
            margin: 0.6em 0;
            color: var(--text-primary);
        }

        .response-container ul,
        .response-container ol {
            margin: 0.6em 0;
            padding-left: 1.5em;
            color: var(--text-primary);
        }

        .response-container li {
            margin: 0.3em 0;
        }

        .response-container blockquote {
            margin: 0.8em 0;
            padding: 0.5em 1em;
            border-left: 2px solid var(--border-strong);
            background: var(--bg-surface);
            border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
        }

        .response-container code {
            background: var(--bg-elevated);
            padding: 0.15em 0.4em;
            border-radius: var(--radius-sm);
            font-family: var(--font-mono);
            font-size: 0.85em;
        }

        .response-container pre {
            background: var(--bg-surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            padding: var(--space-md);
            overflow-x: auto;
            margin: 0.8em 0;
        }

        .response-container pre code {
            background: none;
            padding: 0;
        }

        .response-container a {
            color: var(--accent);
            text-decoration: underline;
            text-underline-offset: 2px;
        }

        .response-container strong,
        .response-container b {
            font-weight: var(--font-weight-semibold);
        }

        .response-container hr {
            border: none;
            border-top: 1px solid var(--border);
            margin: 1.5em 0;
        }

        .response-container table {
            border-collapse: collapse;
            width: 100%;
            margin: 0.8em 0;
        }

        .response-container th,
        .response-container td {
            border: 1px solid var(--border);
            padding: var(--space-sm);
            text-align: left;
        }

        .response-container th {
            background: var(--bg-surface);
            font-weight: var(--font-weight-semibold);
        }

        .response-container::-webkit-scrollbar {
            width: 6px;
        }

        .response-container::-webkit-scrollbar-track {
            background: transparent;
        }

        .response-container::-webkit-scrollbar-thumb {
            background: var(--border-strong);
            border-radius: 3px;
        }

        .response-container::-webkit-scrollbar-thumb:hover {
            background: #444444;
        }

        /* ── Response navigation strip ── */

        .response-nav {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: var(--space-sm);
            padding: var(--space-xs) var(--space-md);
            border-top: 1px solid var(--border);
            background: var(--bg-app);
        }

        .nav-btn {
            background: none;
            border: none;
            color: var(--text-muted);
            cursor: pointer;
            padding: var(--space-xs);
            border-radius: var(--radius-sm);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: color var(--transition);
        }

        .nav-btn:hover:not(:disabled) {
            color: var(--text-primary);
        }

        .nav-btn:disabled {
            opacity: 0.25;
            cursor: default;
        }

        .nav-btn svg {
            width: 14px;
            height: 14px;
        }

        .response-counter {
            font-size: var(--font-size-xs);
            color: var(--text-muted);
            font-family: var(--font-mono);
            min-width: 40px;
            text-align: center;
        }

        /* ── Bottom input bar ── */

        .input-bar {
            display: flex;
            align-items: center;
            gap: var(--space-sm);
            padding: var(--space-md);
            background: var(--bg-app);
        }

        .input-bar-inner {
            display: flex;
            align-items: center;
            flex: 1;
            background: var(--bg-elevated);
            border: 1px solid var(--border);
            border-radius: 100px;
            padding: 0 var(--space-md);
            height: 32px;
            transition: border-color var(--transition);
        }

        .input-bar-inner:focus-within {
            border-color: var(--accent);
        }

        .input-bar-inner input {
            flex: 1;
            background: none;
            color: var(--text-primary);
            border: none;
            padding: 0;
            font-size: var(--font-size-sm);
            font-family: var(--font);
            height: 100%;
            outline: none;
        }

        .input-bar-inner input::placeholder {
            color: var(--text-muted);
        }

        .analyze-btn {
            position: relative;
            background: var(--bg-elevated);
            border: 1px solid var(--border);
            color: var(--text-primary);
            cursor: pointer;
            font-size: var(--font-size-xs);
            font-family: var(--font-mono);
            white-space: nowrap;
            padding: var(--space-xs) var(--space-md);
            border-radius: 100px;
            height: 32px;
            display: flex;
            align-items: center;
            gap: 4px;
            transition:
                border-color 0.4s ease,
                background var(--transition);
            flex-shrink: 0;
            overflow: hidden;
        }

        .analyze-btn:hover:not(.analyzing) {
            border-color: var(--accent);
            background: var(--bg-surface);
        }

        .analyze-btn.analyzing {
            cursor: default;
            border-color: transparent;
        }

        .analyze-btn-content {
            display: flex;
            align-items: center;
            gap: 4px;
            transition: opacity 0.4s ease;
            z-index: 1;
            position: relative;
        }

        .analyze-btn.analyzing .analyze-btn-content {
            opacity: 0;
        }

        .analyze-canvas {
            position: absolute;
            inset: -1px;
            width: calc(100% + 2px);
            height: calc(100% + 2px);
            pointer-events: none;
        }
    `;

    static properties = {
        responses: { type: Array },
        transcript: { type: String },
        transcripts: { type: Array },
        responseContexts: { type: Array },
        followLatest: { type: Boolean },
        showHistory: { state: true },
        navigationKeys: { state: true },
        audioLevels: { type: Object },
        microphoneCapture: { type: Object },
        isReconnectingMicrophone: { state: true },
        inputMode: { type: String },
        answerLanguage: { type: String },
        asrLanguage: { type: String },
        isSubmittingSpeech: { state: true },
        currentResponseIndex: { type: Number },
        selectedProfile: { type: String },
        onSendText: { type: Function },
        shouldAnimateResponse: { type: Boolean },
        isAnalyzing: { type: Boolean, state: true },
        screenshotError: { state: true },
    };

    constructor() {
        super();
        this.responses = [];
        this.transcript = '';
        this.transcripts = [];
        this.responseContexts = [];
        this.followLatest = true;
        this.showHistory = false;
        const mod = cheatingDaddy.isMacOS ? 'Cmd' : 'Ctrl';
        this.navigationKeys = {
            toggleSessionHistory: mod + '+Shift+H',
            resumeLatest: mod + '+Shift+L',
            scrollInputsUp: mod + '+Alt+Up',
            scrollInputsDown: mod + '+Alt+Down',
            scrollUp: mod + '+Shift+Up',
            scrollDown: mod + '+Shift+Down',
            previousResponse: mod + '+[',
            nextResponse: mod + '+]',
        };
        cheatingDaddy.storage
            .getKeybinds()
            .then(saved => {
                if (saved) this.navigationKeys = { ...this.navigationKeys, ...saved };
            })
            .catch(error => console.warn('Navigation shortcuts:', error.message));
        this.audioLevels = {};
        this.isSubmittingSpeech = false;
        this.isReconnectingMicrophone = false;
        this.currentResponseIndex = -1;
        this.selectedProfile = 'interview';
        this.onSendText = () => {};
        this.isAnalyzing = false;
        this.screenshotError = '';
        this._animFrame = null;
    }

    getProfileNames() {
        return {
            interview: this.t('Job Interview'),
            sales: this.t('Sales Call'),
            meeting: this.t('Business Meeting'),
            presentation: this.t('Presentation'),
            negotiation: this.t('Negotiation'),
            exam: this.t('Exam Assistant'),
        };
    }

    getCurrentResponse() {
        return this.responses.length > 0 && this.currentResponseIndex >= 0
            ? this.responses[this.currentResponseIndex]
            : this.t('等待题目。说话后停顿约 1 秒；未提交时可点击“提交刚才语音”。文件模式请导入音频或截图。');
    }

    renderMarkdown(content) {
        if (typeof window !== 'undefined' && window.marked) {
            try {
                window.marked.setOptions({
                    breaks: true,
                    gfm: true,
                    sanitize: false,
                });
                let rendered = window.marked.parse(content);
                rendered = this.wrapWordsInSpans(rendered);
                return rendered;
            } catch (error) {
                console.warn('Error parsing markdown:', error);
                return content;
            }
        }
        return content;
    }

    wrapWordsInSpans(html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const tagsToSkip = ['PRE'];

        function wrap(node) {
            if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() && !tagsToSkip.includes(node.parentNode.tagName)) {
                const words = node.textContent.split(/(\s+)/);
                const frag = document.createDocumentFragment();
                words.forEach(word => {
                    if (word.trim()) {
                        const span = document.createElement('span');
                        span.setAttribute('data-word', '');
                        span.textContent = word;
                        frag.appendChild(span);
                    } else {
                        frag.appendChild(document.createTextNode(word));
                    }
                });
                node.parentNode.replaceChild(frag, node);
            } else if (node.nodeType === Node.ELEMENT_NODE && !tagsToSkip.includes(node.tagName)) {
                Array.from(node.childNodes).forEach(wrap);
            }
        }
        Array.from(doc.body.childNodes).forEach(wrap);
        return doc.body.innerHTML;
    }

    navigateToPreviousResponse() {
        this.showHistory = false;
        this.setFollowLatest(false);
        if (this.currentResponseIndex > 0) {
            this.currentResponseIndex--;
            this.dispatchEvent(
                new CustomEvent('response-index-changed', {
                    detail: { index: this.currentResponseIndex },
                })
            );
            this.requestUpdate();
        }
    }

    navigateToNextResponse() {
        this.showHistory = false;
        if (this.currentResponseIndex < this.responses.length - 1) {
            this.currentResponseIndex++;
            this.setFollowLatest(this.currentResponseIndex === this.responses.length - 1);
            this.dispatchEvent(
                new CustomEvent('response-index-changed', {
                    detail: { index: this.currentResponseIndex },
                })
            );
            this.requestUpdate();
        }
    }

    setFollowLatest(value) {
        this.followLatest = value;
        this.dispatchEvent(new CustomEvent('follow-latest-changed', { detail: { value } }));
    }

    handleAnswerScroll(event) {
        if (this.showHistory) return;
        const target = event.currentTarget;
        this.setFollowLatest(target.scrollTop + target.clientHeight >= target.scrollHeight - 32);
    }

    handleInputScroll(event) {
        const target = event.currentTarget;
        if (target.scrollTop + target.clientHeight < target.scrollHeight - 32) this.setFollowLatest(false);
    }

    toggleSessionHistory() {
        this.showHistory = !this.showHistory;
        if (this.showHistory) this.setFollowLatest(false);
    }

    resumeLatest() {
        this.showHistory = false;
        this.setFollowLatest(true);
        this.currentResponseIndex = this.responses.length - 1;
        this.dispatchEvent(new CustomEvent('response-index-changed', { detail: { index: this.currentResponseIndex } }));
        this.updateComplete.then(() => this.updateResponseContent());
    }

    scrollResponseUp() {
        this.setFollowLatest(false);
        const container = this.shadowRoot.querySelector(this.showHistory ? '#sessionHistory' : '#responseContainer');
        if (container) container.scrollTop = Math.max(0, container.scrollTop - container.clientHeight * 0.85);
    }

    scrollResponseDown() {
        const container = this.shadowRoot.querySelector(this.showHistory ? '#sessionHistory' : '#responseContainer');
        if (container) {
            container.scrollTop = Math.min(container.scrollHeight, container.scrollTop + container.clientHeight * 0.85);
            if (!this.showHistory) this.setFollowLatest(container.scrollTop + container.clientHeight >= container.scrollHeight - 32);
        }
    }

    scrollInputs(direction) {
        this.setFollowLatest(false);
        this.shadowRoot.querySelectorAll('.source-messages').forEach(element => {
            element.scrollTop += direction * element.clientHeight * 0.85;
        });
    }

    sourceName(source) {
        return this.t(
            { mic: '我 · 麦克风', system: '面试官 · 系统声音', text: '我 · 文字输入', file: '我 · 导入音频', image: '我 · 截图提问' }[source] ||
                '来源未记录'
        );
    }

    connectedCallback() {
        super.connectedCallback();

        if (window.require) {
            const { ipcRenderer } = window.require('electron');

            this.handlePreviousResponse = () => this.navigateToPreviousResponse();
            this.handleNextResponse = () => this.navigateToNextResponse();
            this.handleScrollUp = () => this.scrollResponseUp();
            this.handleScrollDown = () => this.scrollResponseDown();

            ipcRenderer.on('navigate-previous-response', this.handlePreviousResponse);
            ipcRenderer.on('navigate-next-response', this.handleNextResponse);
            ipcRenderer.on('scroll-response-up', this.handleScrollUp);
            ipcRenderer.on('scroll-response-down', this.handleScrollDown);
            this._navigationHandlers = {
                'toggle-session-history': () => this.toggleSessionHistory(),
                'resume-latest-response': () => this.resumeLatest(),
                'scroll-inputs-up': () => this.scrollInputs(-1),
                'scroll-inputs-down': () => this.scrollInputs(1),
            };
            for (const [channel, handler] of Object.entries(this._navigationHandlers)) ipcRenderer.on(channel, handler);
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this._stopWaveformAnimation();

        if (window.require) {
            const { ipcRenderer } = window.require('electron');
            if (this.handlePreviousResponse) ipcRenderer.removeListener('navigate-previous-response', this.handlePreviousResponse);
            if (this.handleNextResponse) ipcRenderer.removeListener('navigate-next-response', this.handleNextResponse);
            if (this.handleScrollUp) ipcRenderer.removeListener('scroll-response-up', this.handleScrollUp);
            if (this.handleScrollDown) ipcRenderer.removeListener('scroll-response-down', this.handleScrollDown);
            for (const [channel, handler] of Object.entries(this._navigationHandlers || {})) ipcRenderer.removeListener(channel, handler);
        }
    }

    async handleSendText() {
        const textInput = this.shadowRoot.querySelector('#textInput');
        if (textInput && textInput.value.trim()) {
            const message = textInput.value.trim();
            textInput.value = '';
            await this.onSendText(message);
        }
    }

    handleTextKeydown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.handleSendText();
        }
    }

    async openScreenPermissionSettings() {
        try {
            const result = await window.require('electron').ipcRenderer.invoke('open-media-settings', 'screen');
            if (!result.success) throw new Error(result.error);
        } catch (error) {
            this.screenshotError = error.message;
        }
    }

    async handleScreenAnswer() {
        if (this.isAnalyzing) return;
        if (!window.captureManualScreenshot) return;
        this.screenshotError = '';
        this.isAnalyzing = true;
        try {
            const result = await window.captureManualScreenshot();
            if (!result?.success) {
                this.screenshotError = result?.error || this.t('截图失败，请重试。');
                cheatingDaddy.setStatus(this.screenshotError);
            }
        } catch (error) {
            this.screenshotError = this.t('截图失败：') + error.message;
            cheatingDaddy.setStatus(this.screenshotError);
        } finally {
            this.isAnalyzing = false;
        }
    }

    _startWaveformAnimation() {
        const canvas = this.shadowRoot.querySelector('.analyze-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;

        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const dangerColor = getComputedStyle(this).getPropertyValue('--danger').trim() || '#EF4444';
        const startTime = performance.now();
        const FADE_IN = 0.5; // seconds
        const PARTICLE_SPREAD = 4; // px inward from border
        const PARTICLE_COUNT = 250;

        // Pill perimeter helpers
        const w = rect.width;
        const h = rect.height;
        const r = h / 2; // pill radius = half height
        const straightLen = w - 2 * r;
        const arcLen = Math.PI * r;
        const perimeter = 2 * straightLen + 2 * arcLen;

        // Given a distance along the perimeter, return {x, y, nx, ny} (position + inward normal)
        const pointOnPerimeter = d => {
            d = ((d % perimeter) + perimeter) % perimeter;
            // Top straight: left to right
            if (d < straightLen) {
                return { x: r + d, y: 0, nx: 0, ny: 1 };
            }
            d -= straightLen;
            // Right arc
            if (d < arcLen) {
                const angle = -Math.PI / 2 + (d / arcLen) * Math.PI;
                return {
                    x: w - r + Math.cos(angle) * r,
                    y: r + Math.sin(angle) * r,
                    nx: -Math.cos(angle),
                    ny: -Math.sin(angle),
                };
            }
            d -= arcLen;
            // Bottom straight: right to left
            if (d < straightLen) {
                return { x: w - r - d, y: h, nx: 0, ny: -1 };
            }
            d -= straightLen;
            // Left arc
            const angle = Math.PI / 2 + (d / arcLen) * Math.PI;
            return {
                x: r + Math.cos(angle) * r,
                y: r + Math.sin(angle) * r,
                nx: -Math.cos(angle),
                ny: -Math.sin(angle),
            };
        };

        // Pre-seed random offsets for stable particles
        const seeds = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            seeds.push({ pos: Math.random(), drift: Math.random(), depthSeed: Math.random() });
        }

        const draw = now => {
            const elapsed = (now - startTime) / 1000;
            const fade = Math.min(1, elapsed / FADE_IN);

            ctx.clearRect(0, 0, w, h);

            // ── Particle border ──
            ctx.fillStyle = dangerColor;
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                const s = seeds[i];
                const along = (s.pos + s.drift * elapsed * 0.03) * perimeter;
                const depth = s.depthSeed * PARTICLE_SPREAD;
                const density = 1 - depth / PARTICLE_SPREAD;

                if (Math.random() > density) continue;

                const p = pointOnPerimeter(along);
                const px = p.x + p.nx * depth;
                const py = p.y + p.ny * depth;
                const size = 0.8 + density * 0.6;

                ctx.globalAlpha = fade * density * 0.85;
                ctx.beginPath();
                ctx.arc(px, py, size, 0, Math.PI * 2);
                ctx.fill();
            }

            // ── Waveform ──
            const midY = h / 2;
            const waves = [
                { freq: 3, amp: 0.35, speed: 2.5, opacity: 0.9, width: 1.8 },
                { freq: 5, amp: 0.2, speed: 3.5, opacity: 0.5, width: 1.2 },
                { freq: 7, amp: 0.12, speed: 5, opacity: 0.3, width: 0.8 },
            ];

            for (const wave of waves) {
                ctx.beginPath();
                ctx.strokeStyle = dangerColor;
                ctx.globalAlpha = wave.opacity * fade;
                ctx.lineWidth = wave.width;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';

                for (let x = 0; x <= w; x++) {
                    const norm = x / w;
                    const envelope = Math.sin(norm * Math.PI);
                    const y = midY + Math.sin(norm * Math.PI * 2 * wave.freq + elapsed * wave.speed) * (midY * wave.amp) * envelope;
                    if (x === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
            }

            ctx.globalAlpha = 1;
            this._animFrame = requestAnimationFrame(draw);
        };

        this._animFrame = requestAnimationFrame(draw);
    }

    _stopWaveformAnimation() {
        if (this._animFrame) {
            cancelAnimationFrame(this._animFrame);
            this._animFrame = null;
        }
        const canvas = this.shadowRoot.querySelector('.analyze-canvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    scrollToBottom() {
        setTimeout(() => {
            const container = this.shadowRoot.querySelector('.response-container');
            if (container) {
                container.scrollTop = container.scrollHeight;
            }
        }, 0);
    }

    firstUpdated() {
        super.firstUpdated();
        this.updateResponseContent();
    }

    updated(changedProperties) {
        super.updated(changedProperties);
        if (changedProperties.has('transcripts') && this.followLatest)
            this.shadowRoot.querySelectorAll('.source-messages').forEach(element => {
                element.scrollTop = element.scrollHeight;
            });
        if (changedProperties.has('responses') || changedProperties.has('currentResponseIndex') || changedProperties.has('uiLanguage')) {
            this.updateResponseContent();
        }

        if (changedProperties.has('isAnalyzing')) {
            if (this.isAnalyzing) {
                this._startWaveformAnimation();
            } else {
                this._stopWaveformAnimation();
            }
        }
    }

    updateResponseContent() {
        const container = this.shadowRoot.querySelector('#responseContainer');
        if (container) {
            const currentResponse = this.getCurrentResponse();
            const renderedResponse = this.renderMarkdown(currentResponse);
            container.innerHTML = renderedResponse;
            if (this.followLatest && !this.showHistory) container.scrollTop = container.scrollHeight;
            if (this.shouldAnimateResponse) {
                this.dispatchEvent(new CustomEvent('response-animation-complete', { bubbles: true, composed: true }));
            }
        }
    }

    async handleQuestionFile(event) {
        const input = event.currentTarget;
        const file = input.files?.[0];
        if (!file) return;
        this.isAnalyzing = true;
        const message = this.shadowRoot.querySelector('#importStatus');
        message.textContent = this.t('处理中：') + file.name;
        try {
            if (file.size > 12 * 1024 * 1024) throw new Error('文件不能超过 12 MB。');
            const data = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result.split(',')[1]);
                reader.onerror = () => reject(new Error('文件读取失败。'));
                reader.readAsDataURL(file);
            });
            const { ipcRenderer } = window.require('electron');
            const result = /\.wav$/i.test(file.name)
                ? await ipcRenderer.invoke('subscription-transcribe-wav', data, true)
                : await ipcRenderer.invoke('send-image-content', { data, prompt: '请解答图片中的题目，说明思路；编程题给出代码和复杂度。' });
            if (!result.success) throw new Error(result.error);
            message.textContent = result.transcript ? this.t('本地转写：') + result.transcript : this.t('图片解题完成');
        } catch (error) {
            message.textContent = this.t('失败：') + error.message;
        } finally {
            this.isAnalyzing = false;
            input.value = '';
        }
    }

    async handleSubmitSpeech() {
        this.isSubmittingSpeech = true;
        try {
            const result = await window.require('electron').ipcRenderer.invoke('subscription-flush-audio');
            cheatingDaddy.setStatus(result.success ? this.t('语音已提交并完成回答') : result.error);
        } catch (error) {
            cheatingDaddy.setStatus(error.message);
        } finally {
            this.isSubmittingSpeech = false;
        }
    }

    async handleReconnectMicrophone() {
        this.isReconnectingMicrophone = true;
        try {
            await cheatingDaddy.reconnectMicrophone();
        } finally {
            this.isReconnectingMicrophone = false;
        }
    }

    renderSpeechPanel() {
        if (!this.inputMode) return '';
        const own = this.transcripts.filter(item => item.source !== 'system');
        const other = this.transcripts.filter(item => item.source === 'system');
        const hasSystem = ['both', 'speaker_only'].includes(this.inputMode);
        return html`<section
            id="speechPanel"
            style="padding:8px 16px;color:var(--text-primary);border-bottom:1px solid var(--border-color);flex-shrink:0;max-height:40vh;overflow:auto"
        >
            <div id="automaticRecordingState">
                ${this.t('自动录音')}：${this.t(this.inputMode === 'files_only' ? '当前未开启麦克风' : this.microphoneCapture?.state === 'running' ? '录音中，停顿后自动转写' : '等待麦克风采集')}
            </div>
            <div class="input-columns" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:8px 0">
                <section id="selfTranscriptPanel" style="border-left:3px solid #60a5fa;padding:4px 8px;background:var(--bg-surface)">
                    <strong>${this.t('我 · 麦克风 / 文字输入')}</strong>
                    <div class="source-messages" style="max-height:110px;overflow:auto" @scroll=${this.handleInputScroll}>
                        ${
                            own.length
                                ? own.map(
                                      item =>
                                          html`<div class="speech-turn" style="padding:5px 0">
                                              <small>${this.sourceName(item.source)}</small>
                                              <div>${item.text}</div>
                                          </div>`
                                  )
                                : html`<div>${this.t('等待我的输入…')}</div>`
                        }
                    </div>
                </section>
                <section id="interviewerTranscriptPanel" style="border-left:3px solid #fbbf24;padding:4px 8px;background:var(--bg-surface)">
                    <strong>${this.t('面试官 · 系统声音')}</strong>
                    <div class="source-messages" style="max-height:110px;overflow:auto" @scroll=${this.handleInputScroll}>
                        ${other.length ? other.map(item => html`<div class="speech-turn" style="padding:5px 0">${item.text}</div>`) : html`<div>${this.t(hasSystem ? '等待对方的系统声音…' : '未开启系统声音；通话时请在首页选择麦克风与系统声音。')}</div>`}
                    </div>
                </section>
            </div>
            <details>
                <summary>${this.t('输入来源与采集诊断')}</summary>
                <div>${this.t('按声音来源标记，不是声纹识人；同一麦克风录到两个人时无法自动区分。自测请选麦克风，双方通话建议戴耳机。')}</div>
                <div id="microphoneCaptureStatus">
                    ${this.t('实际麦克风')}：${this.microphoneCapture?.deviceLabel || '—'} · ${this.t(this.microphoneCapture?.state || '等待采集')}
                </div>
                <meter min="0" max="0.06" .value=${this.audioLevels?.mic || 0}></meter>
                <div id="microphoneNumericLevel">
                    RMS ${(this.microphoneCapture?.rms || 0).toFixed(6)} · ${this.t('峰值')} ${(this.microphoneCapture?.peakRms || 0).toFixed(6)} ·
                    ${this.t('音频帧')} ${this.microphoneCapture?.frames || 0}
                </div>
                ${['mic_only', 'both'].includes(this.inputMode) ? html`<button id="reconnectMicrophone" @click=${this.handleReconnectMicrophone} ?disabled=${this.isReconnectingMicrophone}>${this.t('重连麦克风')}</button><button id="submitSpeech" @click=${this.handleSubmitSpeech} ?disabled=${this.isSubmittingSpeech}>${this.t('提交刚才语音')}</button>` : ''}
            </details>
        </section>`;
    }

    render() {
        const hasMultipleResponses = this.responses.length > 1;

        return html`
            ${this.renderSpeechPanel()}
            <div style="padding:6px 16px;color:var(--text-primary);display:flex;gap:10px;flex-wrap:wrap;align-items:center">
                <button id="toggleSessionHistory" @click=${this.toggleSessionHistory}>
                    ${this.t(this.showHistory ? '返回单条回答' : '当前会话历史')} · ${this.navigationKeys.toggleSessionHistory}
                </button>
                <button id="resumeLatest" @click=${this.resumeLatest}>
                    ${this.t(this.followLatest ? '正在跟随最新消息' : '回到最新并自动跟随')} · ${this.navigationKeys.resumeLatest}
                </button>
                <small
                    >${this.t('翻页')} ${this.navigationKeys.scrollUp} / ${this.navigationKeys.scrollDown} · ${this.t('切换回答')}
                    ${this.navigationKeys.previousResponse} / ${this.navigationKeys.nextResponse}</small
                >
            </div>
            <div id="answerSource" style="padding:6px 16px;color:var(--text-primary);border-left:3px solid #34d399">
                <strong>${this.t(this.showHistory ? '当前会话历史 · 原始输入与 AI 回答' : 'AI 回答（生成内容，不是语音原文）')}</strong>
                ${!this.showHistory && this.responseContexts?.[this.currentResponseIndex] ? html`<div>${this.t('对应输入')}：${this.sourceName(this.responseContexts[this.currentResponseIndex].source)} · ${this.responseContexts[this.currentResponseIndex].question}</div>` : ''}
            </div>
            <div
                class="response-container"
                id="responseContainer"
                style=${this.showHistory ? 'display:none' : ''}
                @scroll=${this.handleAnswerScroll}
            ></div>
            ${
                this.showHistory
                    ? html`<div class="response-container" id="sessionHistory">
                          ${
                              this.responses.length
                                  ? this.responses.map(
                                        (answer, index) =>
                                            html`<article style="padding:12px 0;border-bottom:1px solid var(--border-color)">
                                                <strong>#${index + 1} · ${this.sourceName(this.responseContexts[index]?.source)}</strong>
                                                <div style="white-space:pre-wrap">
                                                    ${this.responseContexts[index]?.question || this.t('旧回答未记录输入来源')}
                                                </div>
                                                <strong style="display:block;margin-top:8px;color:#34d399">${this.t('AI 回答')}</strong>
                                                <div style="white-space:pre-wrap">${answer}</div>
                                            </article>`
                                    )
                                  : this.t('暂无已完成的回答')
                          }
                      </div>`
                    : ''
            }
            ${
                hasMultipleResponses
                    ? html`
                          <div class="response-nav">
                              <button
                                  class="nav-btn"
                                  @click=${this.navigateToPreviousResponse}
                                  ?disabled=${this.currentResponseIndex <= 0}
                                  title=${this.t('Previous response')}
                              >
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                      <path
                                          fill-rule="evenodd"
                                          d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
                                          clip-rule="evenodd"
                                      />
                                  </svg>
                              </button>
                              <span class="response-counter">${this.currentResponseIndex + 1} / ${this.responses.length}</span>
                              <button
                                  class="nav-btn"
                                  @click=${this.navigateToNextResponse}
                                  ?disabled=${this.currentResponseIndex >= this.responses.length - 1}
                                  title=${this.t('Next response')}
                              >
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                      <path
                                          fill-rule="evenodd"
                                          d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
                                          clip-rule="evenodd"
                                      />
                                  </svg>
                              </button>
                          </div>
                      `
                    : ''
            }

            <div style="padding:8px 16px; display:flex; gap:12px; align-items:center; flex-wrap:wrap; color:var(--text-primary)">
                <button @click=${() => this.shadowRoot.querySelector('#questionFile').click()}>${this.t('导入截图或 WAV 音频解题')}</button>
                <input id="questionFile" type="file" accept="image/png,image/jpeg,audio/wav,.wav" @change=${this.handleQuestionFile} hidden />
                <span id="importStatus" role="status" style="font-size:12px"></span>
            </div>
            ${
                this.screenshotError
                    ? html`<div id="screenshotError" role="alert" style="padding:8px 16px; color:var(--danger); overflow-wrap:anywhere">
                          ${this.screenshotError}
                          <button @click=${this.openScreenPermissionSettings}>${this.t('打开屏幕录制设置')}</button>
                      </div>`
                    : ''
            }
            <div class="input-bar">
                <div class="input-bar-inner">
                    <input type="text" id="textInput" placeholder=${this.t('Type a message...')} @keydown=${this.handleTextKeydown} />
                </div>
                <button
                    class="analyze-btn ${this.isAnalyzing ? 'analyzing' : ''}"
                    ?disabled=${this.isAnalyzing}
                    aria-busy=${String(this.isAnalyzing)}
                    @click=${this.handleScreenAnswer}
                >
                    <canvas class="analyze-canvas"></canvas>
                    <span class="analyze-btn-content">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24">
                            <path
                                fill="none"
                                stroke="currentColor"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M13 3v7h6l-8 11v-7H5z"
                            /></svg
                        >${this.t('Analyze Screen')}</span
                    >
                </button>
            </div>
        `;
    }
}

customElements.define('assistant-view', AssistantView);
