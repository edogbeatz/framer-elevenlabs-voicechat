# Framer × ElevenLabs Voice Chat

> Open-source Framer code component for [ElevenLabs Conversational AI](https://try.elevenlabs.io/hlxl3hypn71z). Drop-in voice + text chat widget with full Framer property controls.

<!-- Replace with actual demo GIF/screenshot -->
<!-- ![Demo](docs/demo.gif) -->

## ✨ Features

- **Voice + Text modes** — WebRTC voice chat with automatic WebSocket fallback
- **Framer-native controls** — 40+ customizable properties (colors, fonts, padding, icons, sounds)
- **Mobile overlay mode** — Full-screen chat optimized for iOS Safari
- **Audio heatmap visualizer** — WebGL shader effect with audio reactivity
- **Client tools** — Page navigation, context reading, time queries, user data sync
- **iOS Safari fixes** — Audio warm-up, microphone cleanup, VAD tuning
- **12 test files** — Comprehensive test suite for all hooks and utilities

### 💬 What you get out of the box

This component comes packed with features that are hard to build yourself in Framer — like **voice-triggered page navigation** (something Framer doesn't natively support well, but we found creative workarounds for), **real-time audio visualizers**, **text + voice mode switching**, and **mobile-optimized overlays**. All you need to get started is an **ElevenLabs Agent ID** — paste it in and everything just works.

## 🚀 Quick Start (No coding required!)

You don't need to know how to code to use this. Just copy, paste, and go.

### Step 1 — Open the component file

👉 [**Click here to open the component code**](https://raw.githubusercontent.com/edogbeatz/framer-elevenlabs-voicechat/main/src/framer/ElevenLabsVoiceChat.bundle.tsx)

Select everything on that page (`Cmd + A`) and copy it (`Cmd + C`).

### Step 2 — Paste it into Framer

1. Open your **Framer** project
2. In the left sidebar, click **Assets** (the puzzle piece icon)
3. Click the **+** button → choose **Code Component**
4. **Select all** the default code that appears (`Cmd + A`) and **delete** it
5. **Paste** the code you copied (`Cmd + V`)

### Step 3 — Add it to your page

1. Drag the new **ElevenLabsVoiceChat** component from the Assets panel onto your canvas
2. On the right panel, paste your **ElevenLabs Agent ID** (you get this from [elevenlabs.io](https://try.elevenlabs.io/hlxl3hypn71z))
3. Hit **Preview** — that's it! 🎉

> **💡 Tip:** All the colors, fonts, button styles, and sounds can be customized in the right-side property panel — no code needed.

## 🏗 Architecture

```
src/core/
├── Chat/
│   ├── ElevenLabsVoiceChat.tsx     # Main component (1,387 lines)
│   └── components/                  # Button, ChatInput, ChatHeader, etc.
├── hooks/
│   ├── useElevenLabsSession.ts     # Facade hook (composes all sub-hooks)
│   ├── useSessionConnection.ts     # WebRTC/WebSocket connection lifecycle
│   ├── useClientTools.ts           # Tool registry (skip_turn, end_call, etc.)
│   ├── useAgentNavigation.tsx      # Framer-aware page navigation
│   ├── useChatMessages.ts          # Message state + sessionStorage persistence
│   ├── useAudioControls.ts         # Audio volume/mute controls
│   ├── useSessionTimeout.ts        # Inactivity timeout with warning
│   ├── useScribe.ts                # Standalone speech-to-text via WebSocket
│   └── __tests__/                  # 10 test files
├── Visualizers/
│   ├── AudioHeatmap.tsx            # WebGL shader heatmap
│   ├── BarVisualizer.tsx           # Audio bar visualization
│   └── ShimmeringText.tsx          # Animated text effect
├── ChatTriggerButton/              # Standalone trigger button component
├── utils/                          # Helpers (IDs, storage, fonts, page reader)
└── types.ts                        # Shared TypeScript types

src/framer/
└── ElevenLabsVoiceChat.bundle.tsx  # Self-contained Framer bundle (copy this into Framer)
```

## 🎛 Property Controls

| Section | Controls |
|---------|----------|
| **Agent Config** | Agent ID, Start with Text, Auto Connect, Debug, Display Mode |
| **Trigger Button** | Background, Text, Focus Ring, Border Radius, Border, Padding, Gap, Labels, Font, Beta Text |
| **Visualizer** | Enable, Image, Size, Scale, Colors, Speed, Angle, Glow, Noise, Audio Reactivity |
| **Theme** | Corner Radius, Border, Background, Foreground, Muted, Focus Ring |
| **Chat Interface** | Message Bubble colors, Input field, Fonts |
| **Action Buttons** | Send, Mic, End Call, Call — each with Background, Text, Icon |
| **Icons** | Send, Mic Active, Mic Muted, End Call, Call, Copy, Check |
| **Sounds** | Custom sound effects per status (connecting, thinking, listening, etc.) |

## 🛠 Development

### Prerequisites

- Node.js 18+
- npm 9+

### Setup

```bash
git clone https://github.com/edogbeatz/framer-elevenlabs-voicechat.git
cd framer-elevenlabs-voicechat
npm install
```

### Run Tests

```bash
npm test              # Watch mode
npm run test:run      # Single run
npm run test:coverage # With coverage report
```

### Type Check

```bash
npm run lint
```

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**TL;DR:** Edit `src/core/` first → run tests → copy changes to the bundle.

## 📄 License

[MIT](LICENSE) © Advanced Engineering Lab
