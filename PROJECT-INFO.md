# AI Elite — The Autonomous Neural OS Agent

**Version:** 1.2.3 | **Author:** Hamoex | **Homepage:** https://github.com/Hamoex/AIProject | **License:** MIT | **Node:** v24.1

## Directory Tree

```
AIProject/
├── .changelogrc              # Changelog config (conventional commits)
├── .dockerignore
├── .gitpod.yml
├── .nvmrc                    # v24.1
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── DockerFile
├── LICENSE                   # MIT
├── PROJECT-INFO.md           # This file
├── README.md                 # Full feature docs
├── SECURITY.md
├── banner.jpeg               # Banner image
├── eng.traineddata            # 7.5MB Tesseract OCR data
├── package.json
├── assets/
│   └── banner.jpeg
├── build/
│   ├── customInstall.nsh     # NSIS Defender exclusion hook
│   ├── entitlements.mac.plist
│   ├── icon.icns
│   ├── icon.ico
│   └── icon.png
├── out/
│   ├── main/
│   │   └── index.js           # Main Electron process (bundled)
│   ├── preload/
│   │   └── index.js           # IPC context bridge
│   └── renderer/
│       ├── index.html         # HTML shell
│       ├── models/            # Face-API.js ML models
│       └── assets/
│           ├── index-*.js     # Bundled React frontend
│           └── index-*.css    # Main styles
├── release/
│   └── latest.yml             # Auto-update manifest
├── resources/
│   ├── app-update.yml         # GitHub auto-update config
│   ├── icon.ico               # Application icon
│   └── icon.png
└── .git/
```

## Core Features

- **System/File:** Open/Close App, Read/Write/Manage Files, Smart Drop Zones
- **Vector Search:** LanceDB semantic indexing, Smart File Search, Gallery, Photo Analysis
- **Dev Tools:** Terminal, Open Project, Ghost Coder, Wormhole (localhost tunnel)
- **Desktop UI/Vision:** Teleport Windows, Widgets, Click/Scroll/Shortcut on Screen, Phantom Typer, Screen Peeler (OCR), Screenshot
- **Memory:** Save/Retrieve Core Memory, Save/Read Notes, Read Emails (Gmail)
- **Web/Media/Finance:** Google Search, Weather, Map, Spotify, Stocks, Breaking News, Build Animated Web
- **Communications:** WhatsApp (send/schedule), Email (draft/send)
- **Mobile Telekinesis:** Notifications, Info, Push/Pull Files, Open/Close Apps, Tap/Swipe Screen, Toggle Hardware
- **Research/RAG:** Deep Research (Llama 3 crawling), Notion, Ingest Codebase, Consult Oracle
- **Security:** Lock System Vault (PIN), Biometric Encryption (face recognition)

## Architecture

- **Frontend:** React + Tailwind + Framer Motion
- **Backend:** Electron (Node.js) — full system access
- **IPC:** window.electron.ipcRenderer.invoke("tool-name", payload)
- **Security:** BYOK, local encryption (OS keychain), zero-trust
- **Auto-Update:** electron-updater via GitHub Releases

## Dependencies (55 packages)

- **AI/ML:** groq-sdk, @google/genai, @huggingface/inference, @tavily/core, @xenova/transformers, vectordb, face-api.js, tesseract.js
- **Browser/Web:** puppeteer + stealth, cheerio, axios
- **Desktop Control:** @nut-tree-fork/nut-js, node-window-manager, loudness, screenshot-desktop, clipboardy
- **Google:** googleapis, @google-cloud/local-auth
- **Frontend:** react-router-dom, framer-motion, zustand, three.js + react-three, leaflet, reactflow, recharts, xterm, lucide-react, react-markdown, monaco-editor, qrcode, gsap
- **Other:** electron-store, electron-updater, bcryptjs, pdf-parse, mammoth, untun, glob, ignore, @notionhq/client
