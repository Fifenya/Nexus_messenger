<div align="center">
  <img src="./assets/nexus-logo.svg" alt="Nexus Logo" width="200" />

  # 🔴 NEXUS Messenger ⚫

  ### The Next-Gen Open Source Messenger

  [![TypeScript](https://img.shields.io/badge/TypeScript-78.4%25-blue?logo=typescript)](https://www.typescriptlang.org/)
  [![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react)](https://react.dev/)
  [![Node](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)](https://nodejs.org/)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/Fifenya/Rebuild/pulls)

  **A cyberpunk-inspired Telegram alternative with full theme customization.**

  [Features](#-features) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [Contributing](#-contributing)
</div>

---

## 🎨 Preview

<div align="center">
  <img src="./assets/preview-dark.png" width="45%" alt="Dark Theme" />
  <img src="./assets/preview-custom.png" width="45%" alt="Custom Theme" />
</div>

## ✨ Features

- 🌐 **Real-time Messaging** — WebSocket-based instant delivery via Socket.IO
- 🎭 **Full Theme Customization** — Switch between dark, red, or your own palette
- 📱 **Cross-Platform** — Web, Mobile (Android via Termux), Desktop
- 🔒 **Privacy First** — E2E encryption roadmap, self-hostable
- ⚡ **Type-Safe** — Full TypeScript + Zod validation end-to-end
- 🐳 **Docker Ready** — One-command deployment with Docker Compose
- 🎨 **Modern UI** — Built with Tailwind CSS, smooth animations, glass morphism

## 🚀 Quick Start

### Prerequisites

- Node.js `>= 18.0.0`
- Docker & Docker Compose (optional)
- Git

### Installation

1. **Clone the repository**
```bash
   git clone https://github.com/Fifenya/Rebuild.git nexus-messenger
   cd nexus-messenger
```

2. **Install all dependencies**
```bash
   npm run install:all
```

3. **Configure environment**
```bash
   cp .env.example .env
   # Edit .env with your settings
```

4. **Start development servers**
```bash
   # Frontend
   npm run dev:frontend
   
   # Backend (in another terminal)
   npm run dev:backend
```

### 🐳 Docker Deployment

```bash
docker-compose up -d
```

### 📱 Termux (Android) Setup

```bash
chmod +x termux-setup.sh
./termux-setup.sh
npm run termux:setup
```

## 🎨 Theme System

Nexus comes with a built-in theme engine. Default palette:

| Color | Hex | Usage |
|-------|-----|-------|
| ⚫ Void Black | `#0a0a0a` | Primary background |
| ⚫ Deep Obsidian | `#1a1a1a` | Secondary surfaces |
| 🔴 Nexus Red | `#dc2626` | Accent / Action buttons |
| 🔴 Crimson | `#ef4444` | Hover states |
| ⚪ Pure White | `#ffffff` | Primary text |

### Creating Custom Themes

```tsx
import { useTheme } from '@/hooks/useTheme';

const myTheme = {
  colors: {
    background: '#1e1e2e',
    accent: '#f38ba8',
    text: '#cdd6f4'
  }
};

function App() {
  const { setTheme } = useTheme();
  return <button onClick={() => setTheme(myTheme)}>Apply Catppuccin</button>;
}
```

## 🏗 Architecture

Rebuild/
├── packages/
│   ├── frontend/      # React + Vite + Tailwind
│   └── backend/       # Node.js + Socket.IO + Prisma
├── client/            # Mobile client
├── docker-compose.yml
└── ecosystem.config.js

**Stack:** TypeScript, React 18, Zustand, React Hook Form, Zod, Socket.IO, Docker, PM2

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) first.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is d under the e - see the [LICENSE](./LICENSE) file for details.

---

<div align="center">
  <b>Made with ❤️ and 🔴 by the Nexus community</b>
  
  ⭐ Star us on GitHub — it helps!
</div>
