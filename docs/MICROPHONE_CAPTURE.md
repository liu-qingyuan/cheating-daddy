# 0.8.4：麦克风采集不是“拿到权限就成功”

Fixed point: `5c573d05e0c42732d06777292e8d4368d9d00da6`。用户确认“说话时输入电平不动”。TARGET 始终为 cheating-daddy fork；VOXT 仅只读参考，不修改 VOXT、不重置系统隐私权限。

## 观察、推断与未知

- 当前已安装0.8.3，正常 UI 启动显示“麦克风已连接”，播放中性测试音后电平仍为0且没有转写，复现了用户现象；重启新进程后，不新建第二条麦克风流、不新建第二个 AudioContext 的 probe 又收到49次音频回调，并识别到问题。所以不能声称已经确定是权限、默认设备、AudioContext suspended 或某个 macOS 驱动故障。
- 0.8.3 的 setupLinuxMicProcessing 同步返回，未显式 resume、未检查首帧；电平在 Subscription Adapter 内计算且受 engine.ready 限制。启动回归测试实际输出：无回调却已经 ready（RED）。
- 只读参考本地 `/Users/liuqingyuan/work/voxt` commit `fa25ff2`，不是对已安装 VOXT 二进制的运行结论：`Voxt/Transcription/MLXTranscriber.swift:2314` 在1.2秒后检查回调数，0回调则只重建一次；`Voxt/Meeting/Capture/MeetingMicrophoneCapture.swift:33` 选择输入设备、校验格式、安装原生 tap、计算电平，并记录第一次回调。该本地源码与已安装版本是否逐行一致未知。

## 修复合同

保持现有 WebAudio→24k PCM→本地 Qwen ASR→Codex，不盲目迁移整个 Swift 录音模块，不更改监控隐藏机制。setupLinuxMicProcessing 改为 async：显式 resume，等待第一个真实音频回调后才能成功；两秒无回调关闭并重建图一次，仍失败则显示错误。保留 source 强引用，停止清理 source/context/processor/track/watchdog。采集电平在 renderer 的实际 PCM 回调处计算，不依赖 ASR/GPT。持续无回调或 track ended 显示中断；用户可重连麦克风而不重载模型。

新增 `microphoneDeviceId`（空字符串＝系统默认），可在通用设置列出并选定实际设备；不可用的已保存设备不静默替换成别的。会话显示实际设备名和采集状态。设备列表本身只 enumerate，不为了列表额外打开麦克风。重连也遵守已有 macOS 麦克风权限，不代用户放行。

## 当前 / 目标架构

```mermaid
flowchart TB
 A["Mic permission"] --> B["Graph created"] --> C["Immediately claim connected"]
 B --> D["PCM IPC"] --> E["ASR ready gate"] --> F["Meter"]
```

```mermaid
flowchart TB
 A["Selected mic permission"] --> B["Resume graph and await PCM"]
 B --> C["First callback confirms ready"]
 B --> D["No callback: one rebuild or visible failure"]
 C --> M["Direct capture meter and device state"]
 C --> I["Existing PCM IPC"] --> S["ASR and GPT"]
 U["User reconnect"] --> A
```

## 当前 / 目标时序

```mermaid
sequenceDiagram
 participant U as User
 participant R as Renderer
 participant G as Audio graph
 U->>R: Start
 R->>G: Create and connect
 R-->>U: Connected without checking callbacks
 G-->>R: PCM if capture actually runs
```

```mermaid
sequenceDiagram
 participant U as User
 participant R as Renderer
 participant G as Audio graph
 U->>R: Start or reconnect
 R->>G: Resume
 alt First PCM within two seconds
 G-->>R: PCM callback
 R-->>U: Actual device and receiving state
 else No callback
 R->>G: Close and rebuild once
 G-->>R: PCM or timeout
 R-->>U: Receiving or explicit failure
 end
```

## 当前 / 目标状态

```mermaid
stateDiagram-v2
 [*] --> ClaimedReady: Permission granted
 ClaimedReady --> ClaimedReady: No audio callbacks
```

```mermaid
stateDiagram-v2
 [*] --> Starting
 Starting --> Receiving: First callback
 Starting --> Retrying: First timeout
 Retrying --> Receiving: First callback
 Retrying --> Error: Second timeout
 Receiving --> Stalled: No callbacks or ended track
 Stalled --> Starting: User reconnects
 Receiving --> Stopped: End session
 Starting --> Stopped: Cancel
```

## 当前 / 目标局部类关系

```mermaid
classDiagram
 class Renderer {
  setupLinuxMicProcessing(stream)
  stopCapture()
 }
 class Subscription {
  processLocalAudio(pcm, source)
 }
 class AssistantView {
  audioLevels
 }
 Renderer --> Subscription : PCM
 Subscription --> AssistantView : gated level event
```

```mermaid
classDiagram
 class Renderer {
  setupLinuxMicProcessing(stream) Promise
  requestMicrophone()
  reconnectMicrophone()
  stopMicrophoneCapture()
 }
 class AssistantView {
  microphoneCapture
  audioLevels
  handleReconnectMicrophone()
 }
 class CustomizeView {
  microphoneDevices
  microphoneDeviceId
  refreshMicrophones()
 }
 class Subscription {
  processLocalAudio(pcm, source)
 }
 Renderer --> AssistantView : direct capture state and level
 AssistantView --> Renderer : user reconnect
 CustomizeView ..> Renderer : saved selected device
 Renderer --> Subscription : unchanged PCM
```

验收以用户真人讲话的电平和转写反馈为准；测试音频、模拟0回调故障、重复启动和静态源码仅是各自范围的证据，不代替用户现场确认。未确认前不标记日常使用已修复。
