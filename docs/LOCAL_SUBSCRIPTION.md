# 本地中英文 ASR + ChatGPT 订阅

Scope: existing fork, branch `custom/local-speech-codex`. Keep BYOK and full-local providers. Add a `subscription` provider: copied VOXT Qwen3-ASR weights + its installed native runtime, official ChatGPT-authenticated Codex CLI for text and screenshots. No credential extraction, monitor-evasion changes, new hosted service, or API billing fallback.

Acceptance: same installed app transcribes neutral Chinese and English WAVs locally, answers both through the subscription, and answers a screenshot. Microphone/system-audio capture needs macOS permission; file-based tests do not substitute for a live capture test. Failures must be shown, not replaced by canned answers.

Module / Interface: `SubscriptionEngine.start/stop/transcribe/answer` owns native process lifecycle and Codex invocation. `subscription.js` is the existing local-provider Interface Adapter, forwarding results through existing renderer events. Files and provider settings are explicit; credentials remain owned by Codex. One request at a time; cancellation terminates owned processes. Image content is untrusted; Codex is read-only with shell/apps disabled.

## Current architecture

```mermaid
flowchart TB
 U["Renderer"] --> I["Existing IPC"]
 I --> G["Gemini BYOK"]
 I --> L["Whisper English + local Llama"]
```

## Target architecture

```mermaid
flowchart TB
 U["Renderer"] --> I["Existing IPC"]
 I --> O["Unchanged providers"]
 I --> S["Subscription Adapter"]
 S --> E["SubscriptionEngine"]
 E --> V["Owned local Qwen ASR"]
 E --> C["Official Codex CLI subscription"]
```

## Current sequence

```mermaid
sequenceDiagram
 participant U as Renderer
 participant L as Local provider
 participant W as Whisper
 participant M as Llama
 U->>L: PCM audio
 L->>W: English transcription
 W-->>L: Text
 L->>M: Text or image
 M-->>U: Answer event
```

## Target sequence

```mermaid
sequenceDiagram
 participant U as Renderer
 participant S as Subscription Adapter
 participant Q as Local Qwen ASR
 participant C as Codex CLI
 U->>S: PCM audio or image
 opt Audio
 S->>Q: WAV, auto language
 Q-->>S: Transcript
 end
 S->>C: Text or image, existing login
 C-->>S: Answer or explicit failure
 S-->>U: Transcript and answer events
```

## Current states

```mermaid
stateDiagram-v2
 [*] --> Idle
 Idle --> Loading: Local start
 Loading --> Ready: Whisper and Llama ready
 Loading --> Idle: Failure
 Ready --> Idle: Close
```

## Target states

```mermaid
stateDiagram-v2
 [*] --> Idle
 Idle --> Loading: Verify paths and ChatGPT login
 Loading --> Ready: ASR and selected capture ready
 Loading --> Idle: Error or cancel
 Ready --> Answering: Text or screenshot
 Ready --> Transcribing: Audio
 Transcribing --> Answering: Nonempty transcript
 Transcribing --> Ready: Empty or error
 Answering --> Ready: Answer or error
 Ready --> Idle: Close
 Answering --> Idle: Cancel
 Transcribing --> Idle: Cancel
```

## Current classes

```mermaid
classDiagram
 class MainView
 class LocalAI {
 initializeLocalSession()
 processLocalAudio()
 sendLocalImage()
 }
 MainView --> LocalAI
```

## Target classes

```mermaid
classDiagram
 class MainView
 class SubscriptionAdapter {
 initializeLocalSession()
 processLocalAudio()
 sendLocalImage()
 }
 class SubscriptionEngine {
 start()
 stop()
 transcribe()
 answer()
 }
 MainView --> SubscriptionAdapter
 SubscriptionAdapter --> SubscriptionEngine
```

Runtime dependencies: `/Applications/Voxt.app` remains installed, model directory selected in UI, Codex CLI signed in using ChatGPT. No automatic download or paid fallback. Models and scratch files under `work/` stay outside Git.

## 实时麦克风启动修复

订阅模式不在 Start Session 时申请屏幕共享；麦克风启动成功后才进入会话，拒绝权限会显示原始错误并结束模型会话。截图只在 Analyze Screen 时请求。文件模式明确显示未开启麦克风。讲话结束后需停顿约一秒，才提交本地 ASR；播放音频应选择系统声音，不能用文件模式期待自动收音。

## Permission preflight (0.8.8)

The home page checks microphone and Screen Recording independently on macOS, with explicit settings buttons and a recheck when the app regains focus. Before model startup, `media-permissions` gates only the permissions needed by the selected input mode: mic-only needs microphone, system-only needs Screen Recording, both needs both, files-only needs neither. Missing optional screenshot access does not disable microphone-only sessions. A granted status does not prove successful PCM, transcription or screenshot output.

The first microphone request uses Electron's normal consent dialog. Denied microphone access and screen access use the whitelist-only `open-media-settings` handler. Settings URLs follow Chromium's Ventura+ PrivacySecurity extension path, with the legacy security pane on older macOS. Only the main renderer may use these IPC handlers. No arbitrary destination, camera, Full Disk Access or Accessibility access is requested. The user changes the OS grant. If status remains denied, fully quit and reopen the installed app, then recheck. Local ad-hoc updates may need authorization again; no TCC bypass or weakened signing requirements are used.

Cmd+Enter and the screenshot button share `AssistantView.handleScreenAnswer`: busy state, duplicate suppression, durable failure text and a settings button. These are screenshot controls, not recording hotkeys; continuous recording remains unchanged.

Long-problem capture is a separate proposed feature: collect ordered overlapping images, preview/remove them, then submit the group. A prompt cannot recover pixels never captured. This version does not implement multi-image capture or automatic scrolling.

Sources:

- https://github.com/electron/electron/blob/v30.0.5/docs/api/system-preferences.md
- https://chromium.googlesource.com/chromium/src/+/117.0.5938.132/base/mac/mac_util.mm
- https://github.com/jordanbaird/Ice/blob/main/Ice/Permissions/Permission.swift
