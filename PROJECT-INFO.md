# IRIS AI — The Autonomous Neural OS Agent
**Version:** 1.2.3 | **Author:** Harsh Pandey (201Harsh) | **Homepage:** https://irisaiw.vercel.app | **License:** MIT | **Node:** v24.1

## Directory Tree
```
app-extracted/
├── .changelogrc              # Changelog config (conventional commits)
├── .dockerignore
├── .gitpod.yml
├── .nvmrc                    # v24.1
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── DockerFile
├── LICENSE                   # MIT
├── README.txt                # Full feature docs
├── SECURITY.md
├── banner.jpeg               # 89KB
├── eng.traineddata            # 7.5MB Tesseract OCR data
├── package.json
├── assets/
│   └── banner.jpeg
├── node_modules/              # Full dependency tree
├── out/
│   ├── main/
│   │   └── index.js           # 3,728 lines - main Electron process (bundled, readable)
│   ├── preload/
│   │   └── index.js           # 27 lines - IPC context bridge
│   └── renderer/
│       ├── index.html         # HTML shell
│       ├── models/            # Face-API.js ML models
│       └── assets/
│           ├── index-Py0GEyy8.js   # 158,414 lines - bundled React frontend (minified)
│           ├── index-H5O9alcM.css  # 170KB main styles
│           ├── APP-TIBHWqOR.js     # 6.5KB
│           ├── Gallery-B11OSmXw.js # 16KB
│           ├── Notes-CSkoXWfn.js   # 383KB
│           ├── Settings-BbXf-4JS.js # 41KB
│           ├── WorkFlowEditor-DMhzRAyH.js # 380KB
│           └── WorkFlowEditor-4penBS1k.css # 11KB
├── resources/
│   └── icon.png               # 2.1MB app icon
└── versions/
    ├── latest.yml             # Latest: v1.1.4
    ├── iris-ai-1.0.1-setup.exe     # ~312MB
    ├── iris-ai-1.1.2-setup.exe     # ~312MB
    ├── iris-ai-1.1.4-setup.exe     # ~312MB
    └── win-unpacked/
        ├── iris-ai.exe        # 210MB unpacked executable
        └── ... (Electron runtime DLLs)
```

## Core Features
- **System/File:** Open/Close App, Read/Write/Manage Files, Smart Drop Zones
- **Vector Search:** LanceDB semantic indexing, Smart File Search, Gallery, Photo Analysis
- **Dev Tools:** Terminal, Open Project, Activate Protocol, Build File, Execute Macro/Sequence, Wormhole (localhost tunnel)
- **Desktop UI/Vision:** Teleport Windows, Widgets, Click/Scroll/Shortcut on Screen, Phantom Typer, Screen Peeler (OCR), Ghost Coder, Volume, Screenshot
- **Memory:** Save/Retrieve Core Memory, Save/Read Notes, Read Emails (Gmail)
- **Web/Media/Finance:** Google Search, Weather, Map/Navigation, Spotify, Stocks, Hack Live Website, Build Animated Web, Generate Image
- **Communications:** WhatsApp (send/schedule), Email (draft/send)
- **Mobile Telekinesis:** Notifications, Info, Push/Pull Files, Open/Close Apps, Tap/Swipe Screen, Toggle Hardware
- **Research/RAG:** Deep Research (Llama 3 crawling), Notion, Ingest Codebase, Consult Oracle
- **Security:** Lock System Vault (PIN), Biometric Encryption (face recognition)

## Architecture
- **Frontend:** React + Tailwind + Framer Motion
- **Backend:** Electron (Node.js) - full system access
- **IPC:** window.electron.ipcRenderer.invoke("tool-name", payload)
- **Security:** BYOK, local encryption (OS keychain), zero-trust

## Dependencies (55 packages)
### AI/ML: groq-sdk, @google/genai, @huggingface/inference, @tavily/core, @xenova/transformers, vectordb, face-api.js, tesseract.js
### Browser/Web: puppeteer + stealth, cheerio, axios
### Desktop Control: @nut-tree-fork/nut-js, node-window-manager, loudness, screenshot-desktop, clipboardy
### Google: googleapis, @google-cloud/local-auth
### Frontend: react-router-dom, framer-motion, zustand, three.js + react-three, leaflet, reactflow, recharts, xterm, lucide-react, react-markdown, monaco-editor, qrcode, gsap
### Other: electron-store, electron-updater, bcryptjs, pdf-parse, mammoth, untun, glob, ignore, @notionhq/client
