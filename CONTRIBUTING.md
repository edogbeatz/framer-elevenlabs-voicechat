# Contributing to Framer × ElevenLabs Voice Chat

Thank you for your interest in improving this component! Here's how to get started.

## Development Workflow

This project follows a **source-first** workflow:

1. **Edit `src/core/`** — All logic, hooks, and components live here
2. **Run tests** — `npm test` to verify nothing breaks
3. **Update the bundle** — Copy your changes into `src/framer/ElevenLabsVoiceChat.bundle.tsx`

> ⚠️ **Never edit the bundle first.** The bundle is a distribution artifact — changes there will be overwritten.

## Getting Started

```bash
# Clone and install
git clone https://github.com/edogbeatz/framer-elevenlabs-voicechat.git
cd framer-elevenlabs-voicechat
npm install

# Run tests in watch mode
npm test

# Type check
npm run lint
```

## Project Structure

- `src/core/Chat/` — Main component and sub-components
- `src/core/hooks/` — React hooks (session, connection, messages, tools, etc.)
- `src/core/utils/` — Utility functions
- `src/core/Visualizers/` — WebGL and audio visualizers
- `src/framer/` — The self-contained Framer bundle

## Pull Request Checklist

- [ ] I edited `src/core/` source files (not the bundle directly)
- [ ] All existing tests pass (`npm run test:run`)
- [ ] I added tests for new functionality (if applicable)
- [ ] TypeScript compiles without errors (`npm run lint`)
- [ ] I updated the bundle file to reflect my core changes

## Code Style

- **TypeScript** — All files use TypeScript
- **Functional components** — Use hooks, avoid class components
- **Hoisted styles** — Keep style objects outside components for performance
- **Named exports** — Prefer named exports over default exports

## Reporting Issues

When reporting a bug, please include:

1. **Device/Browser** — e.g., iPhone 15, Safari 17
2. **Steps to reproduce** — What you did
3. **Expected behavior** — What should happen
4. **Actual behavior** — What actually happens
5. **Console errors** — Set `debug: true` on the component and paste the logs

## Questions?

Open a [Discussion](https://github.com/edogbeatz/framer-elevenlabs-voicechat/discussions) or reach out via the issue tracker.
