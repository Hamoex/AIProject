"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
const electron = require("electron");
const path = require("path");
const fs = require("fs");
const utils = require("@electron-toolkit/utils");
const os = require("os");
const child_process = require("child_process");
const Groq = require("groq-sdk");
const fs$1 = require("fs/promises");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const cheerio = require("cheerio");
const nutJs = require("@nut-tree-fork/nut-js");
const screenshot = require("screenshot-desktop");
const loudness = require("loudness");
const url = require("url");
const process$1 = require("process");
const localAuth = require("@google-cloud/local-auth");
const googleapis = require("googleapis");
const util = require("util");
const genai = require("@google/genai");
const nodeWindowManager = require("node-window-manager");
const untun = require("untun");
const crypto = require("crypto");
const core = require("@tavily/core");
const clipboardy = require("clipboardy");
const Prism = require("prismjs");
const Store = require("electron-store");
const bcrypt = require("bcryptjs");
const electronUpdater = require("electron-updater");
const icon = path.join(__dirname, "../../resources/icon.png");
process.on("unhandledRejection", () => {});
process.on("uncaughtException", () => {});
function registerIpcHandlers({ ipcMain, app }) {
  const CHAT_DIR = path.resolve(app.getPath("userData"), "Chat");
  const FILE_PATH = path.join(CHAT_DIR, "aielite_memory.json");
  ipcMain.removeHandler("add-message");
  ipcMain.removeHandler("get-history");
  ipcMain.handle("add-message", async (_event, msg) => {
    try {
      if (!fs.existsSync(CHAT_DIR)) fs.mkdirSync(CHAT_DIR, { recursive: true });
      let history = [];
      if (fs.existsSync(FILE_PATH)) {
        const data = fs.readFileSync(FILE_PATH, "utf-8");
        history = data ? JSON.parse(data) : [];
      }
      const newEntry = {
        role: msg.role,
        content: msg.parts[0].text,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      history.push(newEntry);
      if (history.length > 20) history = history.slice(-20);
      fs.writeFileSync(FILE_PATH, JSON.stringify(history, null, 2));
      return true;
    } catch (err) {
      return false;
    }
  });
  ipcMain.handle("get-history", async () => {
    try {
      if (fs.existsSync(FILE_PATH)) {
        const data = fs.readFileSync(FILE_PATH, "utf-8");
        const raw = JSON.parse(data);
        return raw.map((m) => ({
          role: m.role === "aielite" ? "model" : m.role,
          parts: [{ text: m.content }]
        }));
      }
    } catch (err) {
    }
    return [];
  });
}
const runCommand$1 = (cmd) => {
  return new Promise((resolve) => {
    child_process.exec(cmd, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout) => {
      resolve(stdout ? stdout.trim() : "");
    });
  });
};
let cpuLastSnapshot = os.cpus();
function getSystemCpuUsage() {
  const cpus = os.cpus();
  let idle = 0;
  let total = 0;
  for (let i = 0; i < cpus.length; i++) {
    const cpu = cpus[i];
    const prevCpu = cpuLastSnapshot[i];
    let currentTotal = 0;
    for (const type in cpu.times) currentTotal += cpu.times[type];
    let prevTotal = 0;
    for (const type in prevCpu.times) prevTotal += prevCpu.times[type];
    idle += cpu.times.idle - prevCpu.times.idle;
    total += currentTotal - prevTotal;
  }
  cpuLastSnapshot = cpus;
  return total === 0 ? "0.0" : ((total - idle) / total * 100).toFixed(1);
}
function registerSystemHandlers(ipcMain) {
  ipcMain.removeHandler("get-installed-apps");
  ipcMain.handle("get-installed-apps", async () => {
    try {
      if (os.platform() !== "win32") return [];
      const cmd = `powershell "Get-StartApps | Select-Object Name, AppID | ConvertTo-Json -Depth 1"`;
      const jsonOutput = await runCommand$1(cmd);
      if (!jsonOutput) return [];
      let rawData;
      try {
        rawData = JSON.parse(jsonOutput);
      } catch (parseError) {
        return [];
      }
      const appsArray = Array.isArray(rawData) ? rawData : [rawData];
      return appsArray.filter((a) => a && a.Name && a.AppID).map((a) => ({
        name: a.Name.trim(),
        id: a.AppID.trim()
      })).sort((a, b) => a.name.localeCompare(b.name));
    } catch (e) {
      return [];
    }
  });
  ipcMain.removeHandler("get-system-stats");
  ipcMain.handle("get-system-stats", async () => {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    return {
      cpu: getSystemCpuUsage(),
      memory: {
        total: (totalMem / 1024 ** 3).toFixed(1) + " GB",
        free: (freeMem / 1024 ** 3).toFixed(1) + " GB",
        usedPercentage: ((totalMem - freeMem) / totalMem * 100).toFixed(1)
      },
      temperature: 50,
      os: {
        type: "Windows 11",
        uptime: (os.uptime() / 3600).toFixed(1) + "h"
      }
    };
  });
  ipcMain.removeHandler("get-drives");
  ipcMain.handle("get-drives", async () => {
    try {
      const cmd = `powershell "Get-PSDrive -PSProvider FileSystem | Select-Object Name, @{N='FreeGB';E={[math]::round($_.Free/1GB, 2)}}, @{N='TotalGB';E={[math]::round(($_.Used + $_.Free)/1GB, 2)}} | ConvertTo-Json"`;
      const output = await runCommand$1(cmd);
      return output ? JSON.parse(output) : [];
    } catch (e) {
      return [];
    }
  });
}
let pipeline = null;
let lancedb = null;
const getSystemPath$1 = (name) => {
  try {
    return electron.app.getPath(name);
  } catch (e) {
    const home = os.homedir();
    switch (name.toLowerCase()) {
      case "desktop":
        return path.join(home, "Desktop");
      case "documents":
        return path.join(home, "Documents");
      case "downloads":
        return path.join(home, "Downloads");
      case "music":
        return path.join(home, "Music");
      case "pictures":
        return path.join(home, "Pictures");
      case "videos":
        return path.join(home, "Videos");
      default:
        return home;
    }
  }
};
async function getActiveDrives() {
  if (os.platform() === "win32") {
    const drives = [];
    for (let i = 65; i <= 90; i++) {
      const drive = String.fromCharCode(i) + ":\\";
      try {
        await fs.promises.access(drive, fs.constants.R_OK);
        drives.push(drive);
      } catch {
        continue;
      }
    }
    return drives.length > 0 ? drives : ["C:\\"];
  }
  return ["/"];
}
const IGNORE_FOLDERS = /* @__PURE__ */ new Set([
  "node_modules",
  "appdata",
  "program files",
  "windows",
  "system volume information",
  "dist",
  "build",
  ".git",
  "$recycle.bin"
]);
function registerFileSearch(ipcMain) {
  ipcMain.handle("index-folder", async (event, folderPath) => {
    try {
      event.sender.send("semantic-progress", {
        status: "booting",
        text: "Initializing Neural Engine...",
        progress: 10
      });
      if (!pipeline) pipeline = (await import("@xenova/transformers")).pipeline;
      if (!lancedb) lancedb = await import("vectordb");
      const dbPath = path.join(electron.app.getPath("userData"), "aielite_semantic_db");
      const db = await lancedb.connect(dbPath);
      const extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
      event.sender.send("semantic-progress", {
        status: "scanning",
        text: `Native Sweeping folder...`,
        progress: 50
      });
      const filesToIndex = [];
      const VALID_INDEX_EXTENSIONS = /* @__PURE__ */ new Set([
        ".txt",
        ".md",
        ".js",
        ".ts",
        ".tsx",
        ".jsx",
        ".json",
        ".py",
        ".html",
        ".css"
      ]);
      async function scanForIndexing(dir) {
        let entries;
        try {
          entries = await fs.promises.readdir(dir, { withFileTypes: true });
        } catch (err) {
          return;
        }
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          const nameLower = entry.name.toLowerCase();
          if (entry.isDirectory()) {
            if (nameLower.startsWith(".") || nameLower.startsWith("$") || IGNORE_FOLDERS.has(nameLower))
              continue;
            await scanForIndexing(fullPath);
          } else if (entry.isFile()) {
            if (VALID_INDEX_EXTENSIONS.has(path.extname(nameLower))) filesToIndex.push(fullPath);
          }
        }
      }
      await scanForIndexing(path.resolve(folderPath));
      const records = [];
      let processed = 0;
      for (const file of filesToIndex) {
        try {
          const content = await fs.promises.readFile(file, "utf-8");
          if (content.trim().length === 0) continue;
          processed++;
          if (processed % 5 === 0)
            event.sender.send("semantic-progress", {
              status: "indexing",
              text: `Vectorizing: ${path.basename(file)}`,
              progress: 50 + processed / filesToIndex.length * 40
            });
          const textChunk = content.substring(0, 1e3);
          const output = await extractor(textChunk, { pooling: "mean", normalize: true });
          records.push({
            vector: Array.from(output.data),
            file_path: file,
            file_name: path.basename(file),
            content_snippet: textChunk.substring(0, 200)
          });
        } catch (e) {
        }
      }
      event.sender.send("semantic-progress", {
        status: "saving",
        text: "Writing DB...",
        progress: 95
      });
      if (records.length > 0) {
        try {
          const table = await db.openTable("files");
          await table.add(records);
        } catch {
          await db.createTable("files", records);
        }
      }
      return `✅ Successfully indexed ${filesToIndex.length} files.`;
    } catch (err) {
      return `❌ Indexing Error: ${String(err)}`;
    }
  });
  ipcMain.handle("search-files", async (event, { query, groqKey }) => {
    try {
      event.sender.send("semantic-progress", {
        status: "searching",
        text: "Waking Llama 3.1...",
        progress: 10
      });
      if (!groqKey || groqKey.trim() === "") {
        throw new Error("Missing Groq API Key. Please configure it in the Command Center Vault.");
      }
      let semanticResultsText = "";
      let nativeResultsText = "";
      let searchParams = { keywords: [], root_target: "" };
      const runSemantic = async () => {
        try {
          if (!pipeline) pipeline = (await import("@xenova/transformers")).pipeline;
          if (!lancedb) lancedb = await import("vectordb");
          const dbPath = path.join(electron.app.getPath("userData"), "aielite_semantic_db");
          if (!fs.existsSync(dbPath)) return;
          const db = await lancedb.connect(dbPath);
          const table = await db.openTable("files");
          const extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
          const queryOutput = await extractor(query, { pooling: "mean", normalize: true });
          const results = await table.search(Array.from(queryOutput.data)).limit(3).execute();
          if (results.length > 0) {
            semanticResultsText = `🧠 CONTENT MEMORY MATCHES:
` + results.map((r) => `- ${r.file_path}`).join("\n") + "\n\n";
          }
        } catch (e) {
        }
      };
      const runNativeCrawler = async () => {
        const groq = new Groq({ apiKey: groqKey });
        const prompt = `
          Extract the core search keywords from this user query: "${query}".
          RULES:
          1. Extract the specific file name (e.g. "mainresume"), extension ("pdf", "txt"), and nested folder names ("career").
          2. NEVER include the words "file", "document", "folder", or "find" in the keywords array. Use exact extensions only (e.g., "pdf" not "pdf file").
          3. FIX ANY SPELLING MISTAKES (e.g., "carrer" -> "career").
          4. If the user mentions a root location (like "desktop", "documents", "downloads"), put it in the "root_target" string. Otherwise leave it empty.
          5. Output JSON with "keywords" (array of lowercase strings) and "root_target" (string).
        `;
        const chatCompletion = await groq.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: "llama-3.1-8b-instant",
          response_format: { type: "json_object" }
        });
        try {
          const parsed = JSON.parse(
            chatCompletion.choices[0]?.message?.content || '{"keywords":[]}'
          );
          searchParams.root_target = parsed.root_target || "";
          if (Array.isArray(parsed.keywords)) searchParams.keywords = parsed.keywords;
          else if (typeof parsed.keywords === "string")
            searchParams.keywords = parsed.keywords.split(/[\s,]+/);
        } catch (e) {
          searchParams.keywords = [];
        }
        searchParams.keywords = searchParams.keywords.filter(Boolean).map((kw) => String(kw).toLowerCase().trim());
        if (searchParams.keywords.length === 0) return;
        event.sender.send("semantic-progress", {
          status: "searching",
          text: `Engine Locked On: [ ${searchParams.keywords.join(" + ")} ]`,
          progress: 30
        });
        const searchRoots = /* @__PURE__ */ new Set();
        let rawInput = searchParams.root_target.trim().toLowerCase();
        if (rawInput) {
          if (os.platform() === "win32" && (rawInput.length === 1 || rawInput.includes("drive"))) {
            const driveLetter = rawInput.charAt(0).toUpperCase();
            searchRoots.add(`${driveLetter}:\\`);
          } else if (["desktop", "documents", "downloads", "music", "pictures", "videos"].includes(rawInput)) {
            searchRoots.add(getSystemPath$1(rawInput));
          } else {
            searchRoots.add(path.join(os.homedir(), rawInput));
          }
        } else {
          searchRoots.add(os.homedir());
          const drives = await getActiveDrives();
          drives.forEach((d) => {
            if (!d.startsWith("C")) searchRoots.add(d);
          });
        }
        const rootArray = Array.from(searchRoots);
        event.sender.send("semantic-progress", {
          status: "searching",
          text: `Native Sweeping Nested Folders...`,
          progress: 50
        });
        const foundFiles = [];
        const queue = [...rootArray];
        const visited = /* @__PURE__ */ new Set();
        while (queue.length > 0 && foundFiles.length < 15) {
          const currentDir = queue.shift();
          if (!currentDir || visited.has(currentDir)) continue;
          visited.add(currentDir);
          let entries;
          try {
            entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
          } catch (err) {
            continue;
          }
          for (const entry of entries) {
            if (foundFiles.length >= 15) break;
            const fullPath = path.join(currentDir, entry.name);
            const lowerPath = fullPath.toLowerCase();
            let isDir = entry.isDirectory();
            let isFile = entry.isFile();
            if (entry.isSymbolicLink()) {
              try {
                const stat = await fs.promises.stat(fullPath);
                isDir = stat.isDirectory();
                isFile = stat.isFile();
              } catch (e) {
                continue;
              }
            }
            if (isDir) {
              const name = entry.name.toLowerCase();
              if (name.startsWith(".") || name.startsWith("$") || IGNORE_FOLDERS.has(name)) continue;
              queue.push(fullPath);
            } else if (isFile) {
              const isMatch = searchParams.keywords.every((kw) => lowerPath.includes(kw));
              if (isMatch) {
                foundFiles.push(fullPath);
              }
            }
          }
        }
        const uniqueResults = Array.from(new Set(foundFiles));
        if (uniqueResults.length > 0) {
          nativeResultsText = `⚡ NATIVE DEEP SYSTEM MATCHES:
` + uniqueResults.slice(0, 15).join("\n");
        }
      };
      await Promise.all([runSemantic(), runNativeCrawler()]);
      event.sender.send("semantic-progress", {
        status: "searching",
        text: "Consolidating Results...",
        progress: 95
      });
      const finalOutput = (semanticResultsText + nativeResultsText).trim();
      if (finalOutput.length > 0) {
        return finalOutput;
      } else {
        return `No files found matching [ ${searchParams.keywords.join(", ")} ]`;
      }
    } catch (err) {
      return `❌ System Error: ${String(err)}`;
    }
  });
}
function registerFileOps(ipcMain) {
  ipcMain.handle("file-ops", async (_event, { operation, sourcePath, destPath }) => {
    try {
      switch (operation) {
        case "copy":
          if (!destPath) return "Error: Destination path required for copy.";
          await fs$1.cp(sourcePath, destPath, { recursive: true });
          return `Success: Copied to ${destPath}`;
        case "move":
          if (!destPath) return "Error: Destination path required for move.";
          await fs$1.rename(sourcePath, destPath);
          return `Success: Moved to ${destPath}`;
        case "delete":
          await fs$1.rm(sourcePath, { recursive: true, force: true });
          return `Success: Deleted ${sourcePath}`;
        default:
          return `Error: Unknown operation '${operation}'`;
      }
    } catch (err) {
      return `System Error: ${err}`;
    }
  });
}
function registerFileWrite(ipcMain) {
  ipcMain.handle("write-file", async (_event, { fileName, content }) => {
    try {
      const isAbsolutePath = fileName.includes("/") || fileName.includes("\\");
      const targetPath = isAbsolutePath ? fileName : path.join(electron.app.getPath("desktop"), fileName);
      await fs$1.writeFile(targetPath, content, "utf-8");
      return `Success. File saved to: ${targetPath}`;
    } catch (err) {
      return `Error writing file: ${err}`;
    }
  });
}
function registerFileRead(ipcMain) {
  ipcMain.handle("read-file", async (_event, filePath) => {
    try {
      const content = await fs$1.readFile(filePath, "utf-8");
      return content.length > 2e3 ? content.slice(0, 2e3) + "\n...(Truncated)" : content;
    } catch (err) {
      return `Error reading file: ${err}`;
    }
  });
}
function registerFileOpen(ipcMain) {
  ipcMain.handle("file:open", async (_, filePath) => {
    try {
      const error = await electron.shell.openPath(filePath);
      if (error) {
        return { success: false, error };
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: "Internal System Error" };
    }
  });
  ipcMain.handle("file:reveal", async (_, filePath) => {
    try {
      electron.shell.showItemInFolder(filePath);
      return { success: true };
    } catch (e) {
      return { success: false, error: "Failed to reveal item" };
    }
  });
}
const getFileType = (name, isDirectory) => {
  if (isDirectory) return "directory";
  const ext = path.extname(name).toLowerCase();
  const textExts = [
    ".txt",
    ".md",
    ".js",
    ".ts",
    ".jsx",
    ".tsx",
    ".json",
    ".html",
    ".css",
    ".py",
    ".java",
    ".c",
    ".cpp",
    ".h",
    ".csv",
    ".env",
    ".log",
    ".xml",
    ".yml",
    ".yaml"
  ];
  const imgExts = [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".svg", ".webp"];
  const vidExts = [".mp4", ".mkv", ".avi", ".mov", ".webm"];
  const execExts = [".exe", ".msi", ".bat", ".sh", ".app", ".dmg"];
  if (textExts.includes(ext)) return "text";
  if (imgExts.includes(ext)) return "image";
  if (vidExts.includes(ext)) return "video";
  if (execExts.includes(ext)) return "executable";
  return "unknown";
};
const getSystemPath = (name) => {
  try {
    return electron.app.getPath(name);
  } catch (e) {
    const home = os.homedir();
    switch (name) {
      case "desktop":
        return path.join(home, "Desktop");
      case "documents":
        return path.join(home, "Documents");
      case "downloads":
        return path.join(home, "Downloads");
      case "music":
        return path.join(home, "Music");
      case "pictures":
        return path.join(home, "Pictures");
      case "videos":
        return path.join(home, "Videos");
      default:
        return home;
    }
  }
};
function registerDirLoader(ipcMain) {
  ipcMain.handle("read-directory", async (_event, dirPath) => {
    try {
      let rawInput = dirPath.trim();
      let targetPath = rawInput;
      const platform = os.platform();
      if (platform === "win32" && /^[a-zA-Z]:?$/.test(rawInput)) {
        const driveLetter = rawInput.charAt(0).toUpperCase();
        targetPath = `${driveLetter}:\\`;
      } else if (["desktop", "documents", "downloads", "music", "pictures", "videos"].includes(
        rawInput.toLowerCase()
      )) {
        targetPath = getSystemPath(rawInput.toLowerCase());
      } else if (rawInput.toLowerCase() === "home" || rawInput === "~") {
        targetPath = os.homedir();
      } else if (!path.isAbsolute(targetPath)) {
        targetPath = path.join(os.homedir(), rawInput);
      }
      try {
        const stats = await fs$1.stat(targetPath);
        if (!stats.isDirectory()) {
          return `Error: '${targetPath}' is a FILE. Use 'read_file' to read it.`;
        }
      } catch (e) {
        return `Error: Directory not found at '${targetPath}'.`;
      }
      const dirents = await fs$1.readdir(targetPath, { withFileTypes: true });
      const items = dirents.filter((d) => !d.name.startsWith(".")).map((d) => ({
        name: d.name,
        path: path.join(targetPath, d.name),
        isDirectory: d.isDirectory(),
        ext: path.extname(d.name).toLowerCase()
      }));
      const itemsWithStats = await Promise.all(
        items.map(async (item) => {
          try {
            const stats = await fs$1.stat(item.path);
            return { ...item, mtime: stats.mtimeMs, size: stats.size };
          } catch {
            return { ...item, mtime: 0, size: 0 };
          }
        })
      );
      const sortedItems = itemsWithStats.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return b.mtime - a.mtime;
      }).slice(0, 150);
      const results = sortedItems.map((item) => {
        const type = getFileType(item.name, item.isDirectory);
        let infoString = "";
        if (item.isDirectory) {
          infoString = `[DIR] - Use 'read_directory("${item.name}")' to open this folder.`;
        } else {
          const sizeKb = (item.size / 1024).toFixed(1) + "KB";
          infoString = `[${type.toUpperCase()} | ${sizeKb}]`;
        }
        return {
          name: item.name,
          type,
          path: item.path,
          info: infoString
        };
      });
      return JSON.stringify({
        directory: targetPath,
        items_found: results.length,
        content: results
      });
    } catch (err) {
      return `System Error: ${err}`;
    }
  });
}
const runCommand = (cmd) => {
  return new Promise((resolve) => {
    child_process.exec(cmd, (err, stdout) => {
      resolve(err ? "" : stdout.trim());
    });
  });
};
function registerFileScanner(ipcMain) {
  ipcMain.removeHandler("get-running-apps");
  ipcMain.handle("get-running-apps", async () => {
    try {
      if (os.platform() === "win32") {
        const cmd = `powershell "Get-Process | Where-Object {$_.MainWindowTitle -ne ''} | Select-Object -ExpandProperty ProcessName"`;
        const output = await runCommand(cmd);
        const apps = output.split(/\r?\n/).map((a) => a.trim()).filter((a) => a);
        return [...new Set(apps)];
      }
      if (os.platform() === "darwin") {
        const cmd = `osascript -e 'tell application "System Events" to get name of (processes where background only is false)'`;
        const output = await runCommand(cmd);
        return output.split(", ").map((s) => s.trim());
      }
      return [];
    } catch (e) {
      return [];
    }
  });
}
const PROTECTED_PROCESSES = [
  "explorer.exe",
  "dwm.exe",
  "svchost.exe",
  "lsass.exe",
  "csrss.exe",
  "wininit.exe",
  "winlogon.exe",
  "services.exe",
  "taskmgr.exe",
  "system",
  "registry"
];
const APP_ALIASES = {
  vscode: "code",
  code: "code",
  "visual studio code": "code",
  terminal: "wt",
  cmd: "start cmd",
  git: "start git-bash",
  mongo: "mongodbcompass",
  mongodb: "mongodbcompass",
  postman: "postman",
  chrome: "start chrome",
  "google chrome": "start chrome",
  edge: "start msedge",
  brave: "start brave",
  firefox: "start firefox",
  whatsapp: "start whatsapp:",
  discord: "Update.exe --processStart Discord.exe",
  spotify: "start spotify:",
  telegram: "start telegram:",
  tlauncher: "TLauncher",
  minecraft: "MinecraftLauncher",
  "cheat engine": "Cheat Engine",
  steam: "start steam:",
  "epic games": "com.epicgames.launcher:",
  "live wallpaper": "livelywpf",
  lively: "livelywpf",
  notepad: "notepad",
  calculator: "calc",
  settings: "start ms-settings:",
  explorer: "explorer",
  files: "explorer",
  "task manager": "taskmgr",
  camera: "start microsoft.windows.camera:",
  photos: "start microsoft.windows.photos:"
};
const PROCESS_NAMES = {
  vscode: "code.exe",
  code: "code.exe",
  "visual studio code": "code.exe",
  chrome: "chrome.exe",
  "google chrome": "chrome.exe",
  edge: "msedge.exe",
  brave: "brave.exe",
  firefox: "firefox.exe",
  notepad: "notepad.exe",
  cmd: "cmd.exe",
  terminal: "WindowsTerminal.exe",
  whatsapp: "WhatsApp.exe",
  discord: "Discord.exe",
  spotify: "Spotify.exe",
  telegram: "Telegram.exe",
  steam: "steam.exe",
  "epic games": "EpicGamesLauncher.exe",
  camera: "WindowsCamera.exe",
  calculator: "CalculatorApp.exe",
  settings: "SystemSettings.exe",
  "task manager": "Taskmgr.exe",
  photos: "Microsoft.Photos.exe",
  explorer: "explorer.exe",
  files: "explorer.exe"
};
function registerAppLauncher(ipcMain) {
  ipcMain.removeHandler("open-app");
  ipcMain.handle("open-app", async (_event, appName) => {
    return new Promise((resolve) => {
      const lowerName = appName.toLowerCase().trim();
      let command = APP_ALIASES[lowerName];
      if (command) {
        executeCommand(command, appName, resolve);
      } else {
        launchViaPowerShell(appName, resolve);
      }
    });
  });
  ipcMain.removeHandler("close-app");
  ipcMain.handle("close-app", async (_event, appName) => {
    return new Promise((resolve) => {
      const lowerName = appName.toLowerCase().trim();
      let processName = PROCESS_NAMES[lowerName];
      if (!processName) {
        processName = appName.endsWith(".exe") ? appName : `${appName}.exe`;
      }
      if (PROTECTED_PROCESSES.includes(processName.toLowerCase())) {
        resolve({
          success: false,
          error: `Security Protocol: I cannot close '${appName}' (System Critical Process). Doing so would crash your PC.`
        });
        return;
      }
      const cmd = `taskkill /IM "${processName}" /F /T`;
      child_process.exec(cmd, (error) => {
        if (error) {
          resolve({ success: false, error: `Could not close ${appName}. Is it running?` });
        } else {
          resolve({ success: true, message: `Terminated ${appName}` });
        }
      });
    });
  });
}
function executeCommand(command, appName, resolve) {
  child_process.exec(command, (error) => {
    if (error) {
      launchViaPowerShell(appName, resolve);
    } else {
      resolve({ success: true, message: `Opened ${appName}` });
    }
  });
}
function launchViaPowerShell(appName, resolve) {
  const psCommand = `powershell -Command "Get-StartApps | Where-Object { $_.Name -like '*${appName}*' } | Select-Object -First 1 -ExpandProperty AppID"`;
  child_process.exec(psCommand, (error, stdout) => {
    if (error) {
      resolve({
        success: false,
        error: `Could not find '${appName}' on this system. Try opening it manually once.`
      });
      return;
    }
    const appId = stdout.trim();
    if (appId) {
      const launchCmd = `start explorer "shell:AppsFolder\\${appId}"`;
      child_process.exec(launchCmd, (launchErr) => {
        if (launchErr) {
          resolve({ success: false, error: `Found app but could not launch: ${launchErr.message}` });
        } else {
          resolve({ success: true, message: `Opened ${appName} via System Search` });
        }
      });
    } else {
      resolve({
        success: false,
        error: `Could not find '${appName}' on this system. Try opening it manually once.`
      });
    }
  });
}
function registerNotesHandlers(ipcMain) {
  const NOTES_DIR = path.resolve(electron.app.getPath("userData"), "Notes");
  if (!fs.existsSync(NOTES_DIR)) {
    fs.mkdirSync(NOTES_DIR, { recursive: true });
  }
  ipcMain.handle("save-note", async (_event, { title, content }) => {
    try {
      const safeTitle = title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      const fileName = `${safeTitle}.md`;
      const filePath = path.join(NOTES_DIR, fileName);
      const fileContent = `# ${title}

${content}`;
      fs.writeFileSync(filePath, fileContent, "utf-8");
      return { success: true, path: filePath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  ipcMain.handle("get-notes", async () => {
    try {
      const files = fs.readdirSync(NOTES_DIR).filter((f) => f.endsWith(".md"));
      return files.map((file) => {
        const filePath = path.join(NOTES_DIR, file);
        const stats = fs.statSync(filePath);
        const content = fs.readFileSync(filePath, "utf-8");
        return {
          filename: file,
          title: file.replace(".md", "").replace(/_/g, " "),
          content,
          createdAt: stats.birthtime,
          path: filePath
        };
      }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      return [];
    }
  });
  ipcMain.handle("delete-note", async (_event, filename) => {
    try {
      const filePath = path.join(NOTES_DIR, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  });
}
puppeteer.use(StealthPlugin());
const USER_BOOKMARKS = {
  instagram: "https://instagram.com",
  reddit: "https://reddit.com",
  chatgpt: "https://chat.openai.com",
  claude: "https://claude.ai",
  linkedin: "https://linkedin.com"
};
const getSmartUrl = (query) => {
  const lower = query.toLowerCase();
  for (const [key, url2] of Object.entries(USER_BOOKMARKS)) {
    if (lower.includes(key)) {
      return { url: url2, source: "Bookmark", skipScrape: false };
    }
  }
  if (lower.includes("amazon") || lower.includes("buy") || lower.includes("shop for")) {
    const term = lower.replace(/(amazon|buy|price of|shop for)/g, "").trim();
    return {
      url: `https://www.amazon.in/s?k=${encodeURIComponent(term)}`,
      source: "Amazon",
      skipScrape: true
    };
  }
  if (lower.includes("github") || lower.includes("repo")) {
    const match = lower.match(/github(?: profile)?(?: of)?\s+(\w+)/);
    const term = match ? match[1] : lower.replace("github", "").trim();
    return {
      url: `https://github.com/${term}`,
      source: "GitHub",
      skipScrape: false
    };
  }
  if (lower.includes("youtube") || lower.includes("watch")) {
    const term = lower.replace(/(youtube|watch)/g, "").trim();
    return {
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(term)}`,
      source: "YouTube",
      skipScrape: true
    };
  }
  if (lower.startsWith("open ") || lower.startsWith("go to ")) {
    const term = lower.replace(/^(open|go to)( the)?\s+/, "").trim();
    if (!term.includes("who") && !term.includes("what") && !term.includes("how")) {
      return {
        url: `https://duckduckgo.com/?q=!ducky+${encodeURIComponent(term)}`,
        source: "Smart Redirect",
        skipScrape: false
      };
    }
  }
  return null;
};
function registerWebAgent(ipcMain) {
  ipcMain.handle("google-search", async (_event, query) => {
    let browser = null;
    try {
      const smartRoute = getSmartUrl(query);
      const finalUrl = smartRoute ? smartRoute.url : `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      electron.shell.openExternal(finalUrl);
      if (smartRoute && smartRoute.skipScrape) {
        return `I've opened ${smartRoute.source} for you.`;
      }
      browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
      });
      const page = await browser.newPage();
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );
      const scrapeUrl = smartRoute ? finalUrl : `https://duckduckgo.com/?q=${encodeURIComponent(query)}&ia=web`;
      await page.goto(scrapeUrl, { waitUntil: "networkidle2", timeout: 15e3 });
      const html = await page.content();
      const $ = cheerio.load(html);
      let summary = "";
      if (smartRoute?.source === "GitHub") {
        const name = $(".p-name").text().trim();
        const bio = $(".p-note").text().trim();
        summary = `GitHub Profile: ${name}
Bio: ${bio}`;
      } else {
        const paragraphs = $("p").map((_, el) => $(el).text().trim()).get().filter((t) => t.length > 50).slice(0, 3);
        summary = paragraphs.join("\n\n");
        if (!summary) {
          const snippets = $(".result__snippet").map((_, el) => $(el).text().trim()).get().slice(0, 3);
          summary = snippets.join("\n\n");
        }
      }
      await browser.close();
      if (!summary || summary.length < 20) {
        return "I've opened the website for you.";
      }
      return `I've opened the link. Here is a quick summary:
${summary.substring(0, 500)}...`;
    } catch (error) {
      if (browser) await browser.close();
      return "I opened the browser, but couldn't read the content.";
    }
  });
}
nutJs.keyboard.config.autoDelayMs = 20;
const KEY_MAP = {
  enter: nutJs.Key.Enter,
  return: nutJs.Key.Enter,
  space: nutJs.Key.Space,
  tab: nutJs.Key.Tab,
  escape: nutJs.Key.Escape,
  esc: nutJs.Key.Escape,
  backspace: nutJs.Key.Backspace,
  shift: nutJs.Key.LeftShift,
  control: nutJs.Key.LeftControl,
  ctrl: nutJs.Key.LeftControl,
  alt: nutJs.Key.LeftAlt,
  command: nutJs.Key.LeftSuper,
  win: nutJs.Key.LeftSuper,
  up: nutJs.Key.Up,
  down: nutJs.Key.Down,
  left: nutJs.Key.Left,
  right: nutJs.Key.Right,
  pageup: nutJs.Key.PageUp,
  pagedown: nutJs.Key.PageDown,
  a: nutJs.Key.A,
  b: nutJs.Key.B,
  c: nutJs.Key.C,
  d: nutJs.Key.D,
  e: nutJs.Key.E,
  f: nutJs.Key.F,
  g: nutJs.Key.G,
  h: nutJs.Key.H,
  i: nutJs.Key.I,
  j: nutJs.Key.J,
  k: nutJs.Key.K,
  l: nutJs.Key.L,
  m: nutJs.Key.M,
  n: nutJs.Key.N,
  o: nutJs.Key.O,
  p: nutJs.Key.P,
  q: nutJs.Key.Q,
  r: nutJs.Key.R,
  s: nutJs.Key.S,
  t: nutJs.Key.T,
  u: nutJs.Key.U,
  v: nutJs.Key.V,
  w: nutJs.Key.W,
  x: nutJs.Key.X,
  y: nutJs.Key.Y,
  z: nutJs.Key.Z,
  f1: nutJs.Key.F1,
  f5: nutJs.Key.F5,
  f11: nutJs.Key.F11,
  f12: nutJs.Key.F12
};
function generateHumanPath$1(start, end) {
  const steps = 25;
  const pathArray = [];
  const directionX = end.x > start.x ? 1 : -1;
  const directionY = end.y > start.y ? 1 : -1;
  const deviation = Math.random() * 80 + 20;
  const controlPoint = new nutJs.Point(
    start.x + Math.abs(end.x - start.x) / 2 * directionX + (Math.random() < 0.5 ? -deviation : deviation),
    start.y + Math.abs(end.y - start.y) / 2 * directionY + (Math.random() < 0.5 ? -deviation : deviation)
  );
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = (1 - t) * (1 - t) * start.x + 2 * (1 - t) * t * controlPoint.x + t * t * end.x;
    const y = (1 - t) * (1 - t) * start.y + 2 * (1 - t) * t * controlPoint.y + t * t * end.y;
    pathArray.push(new nutJs.Point(x, y));
  }
  return pathArray;
}
function registerGhostControl(ipcMain) {
  ipcMain.handle("copy-file-to-clipboard", async (_event, filePath) => {
    return new Promise((resolve) => {
      const cmd = `powershell -command "Set-Clipboard -Path '${filePath}'"`;
      child_process.exec(cmd, (error) => {
        if (error) {
          resolve(false);
        } else resolve(true);
      });
    });
  });
  ipcMain.handle("ghost-sequence", async (_event, actions) => {
    try {
      for (const action of actions) {
        if (action.type === "paste") {
          electron.clipboard.writeText(action.text);
          await new Promise((r) => setTimeout(r, 200));
          await nutJs.keyboard.pressKey(nutJs.Key.LeftControl, nutJs.Key.V);
          await nutJs.keyboard.releaseKey(nutJs.Key.V, nutJs.Key.LeftControl);
        } else if (action.type === "wait") {
          await new Promise((r) => setTimeout(r, action.ms || 500));
        } else if (action.type === "type") {
          await nutJs.keyboard.type(action.text);
        } else if (action.type === "press") {
          const k = KEY_MAP[action.key.toLowerCase()];
          if (k !== void 0) {
            if (action.modifiers) {
              const mods = action.modifiers.map((m) => KEY_MAP[m.toLowerCase()]).filter(Boolean);
              for (const mod of mods) await nutJs.keyboard.pressKey(mod);
              await nutJs.keyboard.pressKey(k);
              await nutJs.keyboard.releaseKey(k);
              for (const mod of mods.reverse()) await nutJs.keyboard.releaseKey(mod);
            } else {
              await nutJs.keyboard.pressKey(k);
              await nutJs.keyboard.releaseKey(k);
            }
          }
        } else if (action.type === "click") {
          await nutJs.mouse.leftClick();
        }
      }
      return true;
    } catch (e) {
      return false;
    }
  });
  ipcMain.handle("ghost-click-coordinate", async (_event, { x, y, doubleClick }) => {
    try {
      const primaryDisplay = electron.screen.getPrimaryDisplay();
      const scaleFactor = primaryDisplay.scaleFactor;
      const logicalX = Math.round(x / scaleFactor);
      const logicalY = Math.round(y / scaleFactor);
      const startPoint = await nutJs.mouse.getPosition();
      const endPoint = new nutJs.Point(logicalX, logicalY);
      const pathPoints = generateHumanPath$1(startPoint, endPoint);
      await nutJs.mouse.move(pathPoints);
      if (doubleClick) await nutJs.mouse.doubleClick(nutJs.Button.LEFT);
      else await nutJs.mouse.leftClick();
      return true;
    } catch (e) {
      return false;
    }
  });
  ipcMain.handle("ghost-scroll", async (_event, { direction, amount }) => {
    try {
      const scrollAmount = amount || 500;
      if (direction === "up") await nutJs.mouse.scrollUp(scrollAmount);
      else await nutJs.mouse.scrollDown(scrollAmount);
      return true;
    } catch (e) {
      return false;
    }
  });
  ipcMain.handle("get-screen-size", async () => {
    const primaryDisplay = electron.screen.getPrimaryDisplay();
    return {
      width: primaryDisplay.size.width * primaryDisplay.scaleFactor,
      height: primaryDisplay.size.height * primaryDisplay.scaleFactor
    };
  });
  ipcMain.handle("set-volume", async (_event, level) => {
    try {
      await loudness.setVolume(level);
      return `Volume ${level}%`;
    } catch (e) {
      return "Error";
    }
  });
  ipcMain.handle("take-screenshot", async () => {
    try {
      const filename = `AI ELITE_Capture_${Date.now()}.png`;
      const savePath = path.join(electron.app.getPath("pictures"), filename);
      await screenshot({ filename: savePath });
      electron.shell.showItemInFolder(savePath);
      return `Screenshot saved.`;
    } catch (e) {
      return "Error";
    }
  });
}
function registerSystemControl(ipcMain) {
  const sanitizePath = (inputPath) => {
    let clean = path.normalize(inputPath);
    if (clean.endsWith(path.sep)) clean = clean.slice(0, -1);
    return clean;
  };
  ipcMain.handle("run-shell-command", async (_event, { command, cwd }) => {
    return new Promise((resolve) => {
      const safeCwd = cwd ? sanitizePath(cwd) : void 0;
      const win = electron.BrowserWindow.getAllWindows()[0];
      const child = child_process.spawn("powershell.exe", ["-Command", command], {
        cwd: safeCwd,
        stdio: ["ignore", "pipe", "pipe"]
      });
      child.stdout.on("data", (data) => {
        const output = data.toString();
        if (win) win.webContents.send("terminal-data", output);
      });
      child.stderr.on("data", (data) => {
        const output = data.toString();
        if (win) win.webContents.send("terminal-data", `\x1B[31m${output}\x1B[0m`);
      });
      child.on("close", (code) => {
        const msg = `\r
[Process exited with code ${code}]\r
`;
        if (win) win.webContents.send("terminal-data", msg);
        resolve({ success: code === 0, output: `Completed with code ${code}` });
      });
      child.on("error", (err) => {
        if (win) win.webContents.send("terminal-data", `Error: ${err.message}`);
        resolve({ success: false, output: err.message });
      });
    });
  });
}
function registerGalleryHandlers(ipcMain) {
  const GALLERY_DIR = path.resolve(electron.app.getPath("userData"), "Gallery");
  if (!fs.existsSync(GALLERY_DIR)) {
    fs.mkdirSync(GALLERY_DIR, { recursive: true });
  }
  ipcMain.handle("get-gallery", async () => {
    try {
      if (!fs.existsSync(GALLERY_DIR)) return [];
      const files = fs.readdirSync(GALLERY_DIR).filter((file) => /\.(png|jpg|jpeg|webp|gif)$/i.test(file));
      return files.map((file) => {
        const filePath = path.join(GALLERY_DIR, file);
        const stats = fs.statSync(filePath);
        const fileUrl = url.pathToFileURL(filePath).href;
        return {
          filename: file,
          displayName: file.replace(/_\d+_Generated_by_AI ELITE\.png$/, "").replace(/_/g, " "),
          path: filePath,
          url: fileUrl,
          createdAt: stats.birthtime
        };
      }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      return [];
    }
  });
  ipcMain.handle("save-image-to-gallery", async (_event, { title, base64Data }) => {
    try {
      const safeTitle = (title || "visual").replace(/[^a-z0-9]/gi, "_").toLowerCase().substring(0, 50);
      const timestamp = Date.now();
      const fileName = `${safeTitle}_${timestamp}_Generated_by_AI ELITE.png`;
      const filePath = path.join(GALLERY_DIR, fileName);
      const data = base64Data.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(data, "base64");
      fs.writeFileSync(filePath, buffer);
      return { success: true, path: filePath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  ipcMain.handle("delete-image", async (_event, filename) => {
    try {
      const filePath = path.join(GALLERY_DIR, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  });
  ipcMain.handle("open-image-location", async (_event, filePath) => {
    electron.shell.showItemInFolder(filePath);
  });
  ipcMain.handle("save-image-external", async (_event, sourcePath) => {
    try {
      const { dialog } = require("electron");
      const fs2 = require("fs");
      const { filePath } = await dialog.showSaveDialog({
        title: "Save Image Copy",
        defaultPath: path.basename(sourcePath),
        filters: [{ name: "Images", extensions: ["png", "jpg"] }]
      });
      if (filePath) {
        fs2.copyFileSync(sourcePath, filePath);
        return { success: true };
      }
      return { canceled: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}
const SCOPES = ["https://mail.google.com/"];
const TOKEN_PATH = path.join(electron.app.getPath("userData"), "gmail_token.json");
const CREDENTIALS_PATH = path.join(process$1.cwd(), "credentials.json");
function registerGmailHandlers(ipcMain) {
  async function loadSavedCredentialsIfExist() {
    try {
      const content = await fs$1.readFile(TOKEN_PATH, "utf-8");
      const credentials = JSON.parse(content);
      return googleapis.google.auth.fromJSON(credentials);
    } catch (err) {
      return null;
    }
  }
  async function saveCredentials(client) {
    const content = await fs$1.readFile(CREDENTIALS_PATH, "utf-8");
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;
    const payload = JSON.stringify({
      type: "authorized_user",
      client_id: key.client_id,
      client_secret: key.client_secret,
      refresh_token: client.credentials.refresh_token
    });
    await fs$1.writeFile(TOKEN_PATH, payload);
  }
  async function authorize() {
    let client = await loadSavedCredentialsIfExist();
    if (client) return { client, isNewLogin: false };
    client = await localAuth.authenticate({ scopes: SCOPES, keyfilePath: CREDENTIALS_PATH });
    if (client && client.credentials) {
      await saveCredentials(client);
    }
    const mainWindow2 = electron.BrowserWindow.getAllWindows()[0];
    if (mainWindow2) {
      if (mainWindow2.isMinimized()) mainWindow2.restore();
      mainWindow2.show();
      mainWindow2.focus();
      mainWindow2.setAlwaysOnTop(true);
      mainWindow2.setAlwaysOnTop(false);
    }
    return { client, isNewLogin: true };
  }
  const makeEmail = (to, subject, body) => {
    const str = [`To: ${to}`, `Subject: ${subject}`, "", body].join("\n");
    return Buffer.from(str).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  };
  function parseMessageParts(part, result = { text: "", html: "", attachments: [] }) {
    if (!part) return result;
    if (part.filename && part.filename.length > 0) {
      result.attachments.push({
        filename: part.filename,
        mimeType: part.mimeType,
        size: part.body?.size
      });
    } else {
      if (part.mimeType === "text/plain" && part.body?.data) {
        result.text += Buffer.from(part.body.data, "base64").toString("utf-8");
      } else if (part.mimeType === "text/html" && part.body?.data) {
        result.html += Buffer.from(part.body.data, "base64").toString("utf-8");
      }
    }
    if (part.parts && part.parts.length > 0) {
      for (const childPart of part.parts) {
        parseMessageParts(childPart, result);
      }
    }
    return result;
  }
  ipcMain.removeHandler("gmail-read");
  ipcMain.handle("gmail-read", async (_event, maxResults = 5) => {
    try {
      const { client: auth, isNewLogin } = await authorize();
      if (!auth) throw new Error("Failed to authenticate.");
      const gmail = googleapis.google.gmail({ version: "v1", auth });
      const res = await gmail.users.messages.list({ userId: "me", maxResults });
      const messages = res.data.messages || [];
      const prefix = isNewLogin ? "[SYSTEM NOTICE: Gmail Login was just completed successfully. Tell the user this before reading the emails.]\n\n" : "";
      if (!messages.length) return { speechText: prefix + "📭 Inbox is empty.", uiData: [] };
      let emailListForIris = [];
      let uiDataArray = [];
      for (const msg of messages) {
        const fullMsg = await gmail.users.messages.get({ userId: "me", id: msg.id });
        const headers = fullMsg.data.payload?.headers || [];
        const subject = headers.find((h) => h.name === "Subject")?.value || "No Subject";
        const from = headers.find((h) => h.name === "From")?.value || "Unknown";
        const date = headers.find((h) => h.name === "Date")?.value || "";
        const snippet = fullMsg.data.snippet;
        const parsed = parseMessageParts(fullMsg.data.payload);
        emailListForIris.push(`📧 From: ${from}
Subject: ${subject}
Preview: ${snippet}
`);
        uiDataArray.push({
          id: fullMsg.data.id,
          from,
          subject,
          date,
          preview: snippet,
          body: parsed.html || parsed.text || snippet,
          attachments: parsed.attachments
        });
      }
      return {
        speechText: prefix + emailListForIris.join("\n---\n"),
        uiData: uiDataArray
      };
    } catch (e) {
      return { speechText: `❌ Gmail Error: ${e.message}`, uiData: [] };
    }
  });
  ipcMain.removeHandler("gmail-send");
  ipcMain.handle("gmail-send", async (_event, { to, subject, body }) => {
    try {
      const { client: auth, isNewLogin } = await authorize();
      if (!auth) throw new Error("Failed to authenticate.");
      const gmail = googleapis.google.gmail({ version: "v1", auth });
      const raw = makeEmail(to, subject, body);
      await gmail.users.messages.send({ userId: "me", requestBody: { raw } });
      const prefix = isNewLogin ? "[SYSTEM NOTICE: Login successful.]\n\n" : "";
      return prefix + `✅ Email successfully sent to ${to}.`;
    } catch (e) {
      return `❌ Send Error: ${e.message}`;
    }
  });
  ipcMain.removeHandler("gmail-draft");
  ipcMain.handle("gmail-draft", async (_event, { to, subject, body }) => {
    try {
      const { client: auth, isNewLogin } = await authorize();
      if (!auth) throw new Error("Failed to authenticate.");
      const gmail = googleapis.google.gmail({ version: "v1", auth });
      const raw = makeEmail(to, subject, body);
      await gmail.users.drafts.create({ userId: "me", requestBody: { message: { raw } } });
      const prefix = isNewLogin ? "[SYSTEM NOTICE: Login successful.]\n\n" : "";
      return prefix + `✅ Draft created for ${to}. You can review it in your Gmail.`;
    } catch (e) {
      return `❌ Draft Error: ${e.message}`;
    }
  });
}
function registerLocationHandlers(ipcMain) {
  ipcMain.removeHandler("get-live-location");
  const runPowerShell = (cmd) => {
    return new Promise((resolve) => {
      child_process.exec(`powershell -Command "${cmd.replace(/"/g, '\\"')}"`, (error, stdout) => {
        if (error) {
          return resolve("");
        }
        resolve(stdout ? stdout.trim() : "");
      });
    });
  };
  ipcMain.handle("get-live-location", async () => {
    try {
      const psCommand = `Add-Type -AssemblyName System.Device; $w = New-Object System.Device.Location.GeoCoordinateWatcher; $w.Start(); $t = 0; while($w.Position.Location.IsUnknown -and $t -lt 15) { Start-Sleep -Milliseconds 300; $t++ }; if(!$w.Position.Location.IsUnknown) { Write-Output "$($w.Position.Location.Latitude),$($w.Position.Location.Longitude)" }`;
      const osLocation = await runPowerShell(psCommand);
      if (osLocation && osLocation.includes(",")) {
        const [lat, lon] = osLocation.split(",");
        const geoRes = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
        );
        const geoData = await geoRes.json();
        return {
          city: geoData.city || geoData.locality,
          region: geoData.principalSubdivision,
          country: geoData.countryName,
          lat: parseFloat(lat),
          lon: parseFloat(lon),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          fullString: `${geoData.city || geoData.locality}, ${geoData.principalSubdivision}, ${geoData.countryName}`
        };
      }
      const ipRes = await fetch("http://ip-api.com/json/");
      const ipData = await ipRes.json();
      if (ipData.status === "success") {
        return {
          city: ipData.city,
          region: ipData.regionName,
          country: ipData.country,
          lat: ipData.lat,
          lon: ipData.lon,
          timezone: ipData.timezone,
          fullString: `${ipData.city}, ${ipData.regionName}, ${ipData.country}`
        };
      }
      return null;
    } catch (error) {
      return null;
    }
  });
}
const execAsync = util.promisify(child_process.exec);
let activeDevice = null;
function registerAdbHandlers(ipcMain) {
  const dirPath = path.join(electron.app.getPath("userData"), "Connected Devices");
  const historyPath = path.join(dirPath, "Connect-mobile.json");
  const saveDeviceToHistory = async (ip, port, model) => {
    try {
      await fs$1.mkdir(dirPath, { recursive: true });
      let history = [];
      try {
        const file = await fs$1.readFile(historyPath, "utf-8");
        history = JSON.parse(file);
      } catch (e) {
      }
      const existingIndex = history.findIndex((d) => d.ip === ip);
      const deviceData = { ip, port, model, lastConnected: (/* @__PURE__ */ new Date()).toISOString() };
      if (existingIndex > -1) {
        history[existingIndex] = deviceData;
      } else {
        history.push(deviceData);
      }
      await fs$1.writeFile(historyPath, JSON.stringify(history, null, 2));
    } catch (e) {
    }
  };
  ipcMain.removeHandler("adb-get-history");
  ipcMain.handle("adb-get-history", async () => {
    try {
      const file = await fs$1.readFile(historyPath, "utf-8");
      return JSON.parse(file);
    } catch (e) {
      return [];
    }
  });
  ipcMain.removeHandler("adb-connect");
  ipcMain.handle("adb-connect", async (_, { ip, port }) => {
    try {
      const { stdout } = await execAsync(`adb connect ${ip}:${port}`);
      if (stdout.toLowerCase().includes("connected to") || stdout.toLowerCase().includes("already connected")) {
        activeDevice = { ip, port };
        try {
          const { stdout: modelOut } = await execAsync(
            `adb -s ${ip}:${port} shell getprop ro.product.model`
          );
          await saveDeviceToHistory(ip, port, modelOut.trim().toUpperCase() || "UNKNOWN DEVICE");
        } catch (e) {
        }
        return { success: true };
      }
      return { success: false, error: stdout };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });
  ipcMain.removeHandler("adb-disconnect");
  ipcMain.handle("adb-disconnect", async () => {
    if (!activeDevice) return { success: true };
    try {
      await execAsync(`adb disconnect ${activeDevice.ip}:${activeDevice.port}`);
      activeDevice = null;
      return { success: true };
    } catch (e) {
      return { success: false };
    }
  });
  ipcMain.removeHandler("adb-screenshot");
  ipcMain.handle("adb-screenshot", async () => {
    if (!activeDevice) return { success: false };
    return new Promise((resolve) => {
      child_process.exec(
        `adb -s ${activeDevice.ip}:${activeDevice.port} exec-out screencap -p`,
        { encoding: "buffer", maxBuffer: 1024 * 1024 * 20 },
        (error, stdout) => {
          if (error) {
            resolve({ success: false });
          } else {
            const base64 = `data:image/png;base64,${stdout.toString("base64")}`;
            resolve({ success: true, image: base64 });
          }
        }
      );
    });
  });
  ipcMain.removeHandler("adb-quick-action");
  ipcMain.handle("adb-quick-action", async (_, { action }) => {
    if (!activeDevice) return { success: false };
    const target = `-s ${activeDevice.ip}:${activeDevice.port}`;
    try {
      if (action === "camera") {
        await execAsync(`adb ${target} shell am start -a android.media.action.STILL_IMAGE_CAMERA`);
      } else if (action === "wake") {
        await execAsync(`adb ${target} shell input keyevent KEYCODE_WAKEUP`);
      } else if (action === "lock") {
        await execAsync(`adb ${target} shell input keyevent KEYCODE_SLEEP`);
      } else if (action === "home") {
        await execAsync(`adb ${target} shell input keyevent KEYCODE_HOME`);
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });
  ipcMain.removeHandler("adb-telemetry");
  ipcMain.handle("adb-telemetry", async () => {
    if (!activeDevice) return { success: false, error: "No device connected" };
    const target = `-s ${activeDevice.ip}:${activeDevice.port}`;
    try {
      const { stdout: batteryOut } = await execAsync(`adb ${target} shell dumpsys battery`);
      const levelMatch = batteryOut.match(/level: (\d+)/);
      const tempMatch = batteryOut.match(/temperature: (\d+)/);
      const isCharging = batteryOut.includes("AC powered: true") || batteryOut.includes("USB powered: true");
      const level = levelMatch ? parseInt(levelMatch[1]) : 0;
      const temp = tempMatch ? (parseInt(tempMatch[1]) / 10).toFixed(1) : 0;
      const { stdout: storageOut } = await execAsync(`adb ${target} shell df -h /data`);
      const storageLines = storageOut.trim().split("\n");
      let storageUsed = "0", storageTotal = "0", storagePercent = 0;
      if (storageLines.length > 1) {
        const parts = storageLines[1].trim().split(/\s+/);
        storageTotal = parts[1];
        storageUsed = parts[2];
        storagePercent = parseInt(parts[4].replace("%", "")) || 0;
      }
      const { stdout: modelOut } = await execAsync(`adb ${target} shell getprop ro.product.model`);
      const { stdout: osOut } = await execAsync(
        `adb ${target} shell getprop ro.build.version.release`
      );
      return {
        success: true,
        data: {
          model: modelOut.trim().toUpperCase(),
          os: `ANDROID ${osOut.trim()}`,
          battery: { level, isCharging, temp },
          storage: { used: storageUsed, total: storageTotal, percent: storagePercent }
        }
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });
  ipcMain.removeHandler("get-mobile-info-ai");
  ipcMain.handle("get-mobile-info-ai", async () => {
    if (!activeDevice) return "Error: You are not currently connected to any mobile device.";
    try {
      const target = `-s ${activeDevice.ip}:${activeDevice.port}`;
      const { stdout: batOut } = await execAsync(`adb ${target} shell dumpsys battery`);
      const level = batOut.match(/level: (\d+)/)?.[1] || "Unknown";
      const { stdout: modelOut } = await execAsync(`adb ${target} shell getprop ro.product.model`);
      return `I am currently linked to your ${modelOut.trim()}. The battery is at ${level}%.`;
    } catch (e) {
      return "I am connected, but I could not retrieve the telemetry data.";
    }
  });
  ipcMain.removeHandler("adb-open-app");
  ipcMain.handle("adb-open-app", async (_, { packageName }) => {
    if (!activeDevice) return { success: false, error: "No phone connected." };
    try {
      const target = `-s ${activeDevice.ip}:${activeDevice.port}`;
      if (packageName === "android.media.action.STILL_IMAGE_CAMERA") {
        await execAsync(`adb ${target} shell am start -a android.media.action.STILL_IMAGE_CAMERA`);
        return { success: true };
      }
      await execAsync(
        `adb ${target} shell monkey -p ${packageName} -c android.intent.category.LAUNCHER 1`
      );
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });
  ipcMain.removeHandler("adb-close-app");
  ipcMain.handle("adb-close-app", async (_, { packageName }) => {
    if (!activeDevice) return { success: false, error: "No phone connected." };
    try {
      const target = `-s ${activeDevice.ip}:${activeDevice.port}`;
      if (packageName === "android.media.action.STILL_IMAGE_CAMERA") {
        await execAsync(`adb ${target} shell am force-stop com.google.android.GoogleCamera`);
        return { success: true };
      }
      await execAsync(`adb ${target} shell am force-stop ${packageName}`);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });
  ipcMain.removeHandler("adb-tap");
  ipcMain.handle("adb-tap", async (_, { xPercent, yPercent }) => {
    if (!activeDevice) return { success: false, error: "No device" };
    const target = `-s ${activeDevice.ip}:${activeDevice.port}`;
    try {
      const { stdout } = await execAsync(`adb ${target} shell wm size`);
      const match = stdout.match(/(\d+)x(\d+)/);
      if (match) {
        const width = parseInt(match[1]);
        const height = parseInt(match[2]);
        const x = Math.round(xPercent / 100 * width);
        const y = Math.round(yPercent / 100 * height);
        await execAsync(`adb ${target} shell input tap ${x} ${y}`);
        return { success: true };
      }
      return { success: false, error: "Could not calculate screen size." };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });
  ipcMain.removeHandler("adb-swipe");
  ipcMain.handle("adb-swipe", async (_, { direction }) => {
    if (!activeDevice) return { success: false, error: "No device" };
    const target = `-s ${activeDevice.ip}:${activeDevice.port}`;
    try {
      const { stdout } = await execAsync(`adb ${target} shell wm size`);
      const match = stdout.match(/(\d+)x(\d+)/);
      if (!match) return { success: false };
      const w = parseInt(match[1]);
      const h = parseInt(match[2]);
      const cx = Math.round(w / 2);
      const cy = Math.round(h / 2);
      let cmd = "";
      if (direction === "up")
        cmd = `input swipe ${cx} ${Math.round(h * 0.7)} ${cx} ${Math.round(h * 0.3)} 300`;
      if (direction === "down")
        cmd = `input swipe ${cx} ${Math.round(h * 0.3)} ${cx} ${Math.round(h * 0.7)} 300`;
      if (direction === "left")
        cmd = `input swipe ${Math.round(w * 0.8)} ${cy} ${Math.round(w * 0.2)} ${cy} 300`;
      if (direction === "right")
        cmd = `input swipe ${Math.round(w * 0.2)} ${cy} ${Math.round(w * 0.8)} ${cy} 300`;
      if (cmd) {
        await execAsync(`adb ${target} shell ${cmd}`);
        return { success: true };
      }
      return { success: false, error: "Invalid direction." };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });
  ipcMain.removeHandler("adb-get-notifications");
  ipcMain.handle("adb-get-notifications", async () => {
    if (!activeDevice) return { success: false, error: "No device connected." };
    const target = `-s ${activeDevice.ip}:${activeDevice.port}`;
    try {
      const { stdout } = await execAsync(`adb ${target} shell dumpsys notification --noredact`);
      const notifications = [];
      const lines = stdout.split("\n");
      let currentTitle = "";
      for (const line of lines) {
        if (line.includes("android.title=")) {
          const match = line.match(/android\.title=(?:String|CharSequence) \((.*?)\)/);
          if (match && match[1]) currentTitle = match[1].trim();
        } else if (line.includes("android.text=")) {
          const match = line.match(/android\.text=(?:String|CharSequence) \((.*?)\)/);
          if (match && match[1]) {
            const currentText = match[1].trim();
            const isSystem = currentTitle.toLowerCase().includes("running") || currentTitle.toLowerCase().includes("sync") || currentText.toLowerCase().includes("running");
            if (currentTitle && currentText && !isSystem) {
              const fullMsg = `You got a Message on your Smartphone from ${currentTitle}: ${currentText}`;
              if (!notifications.includes(fullMsg)) {
                notifications.push(fullMsg);
              }
              currentTitle = "";
            }
          }
        }
      }
      return { success: true, data: notifications };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });
  ipcMain.removeHandler("adb-push-file");
  ipcMain.handle("adb-push-file", async (_, { sourcePath, destPath = "/sdcard/Download/" }) => {
    if (!activeDevice) return { success: false, error: "No phone connected." };
    try {
      const target = `-s ${activeDevice.ip}:${activeDevice.port}`;
      await execAsync(`adb ${target} push "${sourcePath}" "${destPath}"`);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });
  ipcMain.removeHandler("adb-pull-file");
  ipcMain.handle("adb-pull-file", async (_, { sourcePath, destPath }) => {
    if (!activeDevice) return { success: false, error: "No phone connected." };
    try {
      const target = `-s ${activeDevice.ip}:${activeDevice.port}`;
      const finalDest = destPath || path.join(electron.app.getPath("downloads"));
      await execAsync(`adb ${target} pull "${sourcePath}" "${finalDest}"`);
      return { success: true, savedTo: finalDest };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });
  ipcMain.removeHandler("adb-hardware-toggle");
  ipcMain.handle("adb-hardware-toggle", async (_, { setting, state }) => {
    if (!activeDevice) return { success: false, error: "No phone connected." };
    const target = `-s ${activeDevice.ip}:${activeDevice.port}`;
    try {
      const cleanSetting = setting.toLowerCase().trim();
      const action = state ? "enable" : "disable";
      if (cleanSetting === "bluetooth" || cleanSetting === "bt") {
        try {
          await execAsync(`adb ${target} shell svc bluetooth ${action}`, { timeout: 5e3 });
        } catch (e) {
          await execAsync(`adb ${target} shell cmd bluetooth_manager ${action}`, { timeout: 5e3 });
        }
        return { success: true };
      }
      if (cleanSetting === "wifi") {
        try {
          await execAsync(`adb ${target} shell svc wifi ${action}`, { timeout: 5e3 });
        } catch (e) {
          const wifiState = state ? "enabled" : "disabled";
          await execAsync(`adb ${target} shell cmd wifi set-wifi-enabled ${wifiState}`, {
            timeout: 5e3
          });
        }
        return { success: true };
      }
      if (cleanSetting === "data" || cleanSetting === "mobile data") {
        await execAsync(`adb ${target} shell svc data ${action}`, { timeout: 5e3 });
        return { success: true };
      }
      if (cleanSetting === "airplane" || cleanSetting === "flight") {
        await execAsync(`adb ${target} shell cmd connectivity airplane-mode ${action}`, {
          timeout: 5e3
        });
        return { success: true };
      }
      if (cleanSetting === "location" || cleanSetting === "gps") {
        const locState = state ? "3" : "0";
        await execAsync(`adb ${target} shell settings put secure location_mode ${locState}`, {
          timeout: 5e3
        });
        return { success: true };
      }
      if (cleanSetting === "flashlight" || cleanSetting === "torch") {
        await execAsync(`adb ${target} shell input keyevent KEYCODE_WAKEUP`);
        await execAsync(`adb ${target} shell cmd statusbar expand-settings`);
        return {
          success: true,
          warning: "Android OS blocks silent flashlight toggles. I have pulled down your Quick Settings menu instead."
        };
      }
      return { success: false, error: `I don't know how to toggle: ${setting}` };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });
}
let hackerWindow = null;
function registerRealityHacker(ipcMain) {
  ipcMain.removeHandler("hack-website");
  ipcMain.handle("hack-website", async (_, { url: url2, mode, customText }) => {
    try {
      if (hackerWindow) {
        hackerWindow.close();
      }
      hackerWindow = new electron.BrowserWindow({
        width: 1400,
        height: 900,
        show: false,
        autoHideMenuBar: true,
        fullscreenable: true,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          webSecurity: false
        }
      });
      await hackerWindow.loadURL(url2);
      hackerWindow.show();
      await new Promise((resolve) => setTimeout(resolve, 3e3));
      if (mode === "emerald_theme" || mode === "both") {
        const themeScript = `
          const style = document.createElement('style');
          style.innerHTML = \`
            @import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap');
            
            /* Universal Black & Emerald Force */
            html, body, main, section, nav, header, aside {
              background-color: #030303 !important;
              color: #34d399 !important; 
              font-family: 'Space Mono', monospace !important;
            }
            
            /* Safe universal text targeting */
            h1, h2, h3, h4, p, a, span, div.markdown {
              color: #34d399 !important;
              text-shadow: 0 0 5px rgba(16, 185, 129, 0.4) !important;
            }

            body { cursor: crosshair !important; padding-top: 30px !important; }

            /* Glassmorphism for containers across all sites */
            ytd-rich-item-renderer, .s-card-container, article, ._ab8w, .feed-shared-update-v2, .Box, .tweet, [data-testid="cellInnerDiv"] {
              background: rgba(16, 185, 129, 0.05) !important;
              border: 1px solid rgba(16, 185, 129, 0.2) !important;
              border-radius: 6px !important;
              backdrop-filter: blur(5px) !important;
            }

            /* Media Corruption */
            img, video, picture, svg {
              filter: sepia(100%) hue-rotate(110deg) saturate(150%) brightness(0.8) contrast(1.2) !important;
            }

            /* 💥 MASSIVE BACKGROUND WATERMARK */
            body::before {
              content: "AI ELITE // HAMOEX";
              position: fixed;
              top: 50%; left: 50%;
              transform: translate(-50%, -50%) rotate(-10deg);
              font-size: 8vw;
              color: rgba(16, 185, 129, 0.04);
              z-index: -1;
              pointer-events: none;
              font-weight: 900;
              white-space: nowrap;
            }

            #aielite-override-banner {
              position: fixed;
              top: 0; left: 0; width: 100vw;
              background: #10b981;
              color: #000;
              text-align: center;
              font-family: 'Space Mono', monospace;
              font-weight: 900;
              font-size: 14px;
              padding: 5px 0;
              z-index: 999999999;
              letter-spacing: 4px;
            }
          \`;
          document.head.appendChild(style);

          const banner = document.createElement('div');
          banner.id = 'aielite-override-banner';
          banner.innerText = '⚠️ NETWORK COMPROMISED // AI ELITE HAS ASSIMILATED THIS DOMAIN ⚠️';
          document.body.appendChild(banner);
        `;
        await hackerWindow.webContents.executeJavaScript(themeScript);
      }
      if ((mode === "rewrite" || mode === "both") && customText) {
        const rewriteScript = `
          const hostname = window.location.hostname;
          
          function assimilateLogos(selectors) {
            selectors.forEach(selector => {
              const logos = document.querySelectorAll(selector);
              logos.forEach(logo => {
                if (!logo.classList.contains('aielite-hacked')) {
                  logo.classList.add('aielite-hacked');
                  logo.style.visibility = 'hidden'; 
                  
                  const newLogo = document.createElement('div');
                  newLogo.innerHTML = \`<strong style="color:#10b981; font-size:24px; visibility: visible; letter-spacing: 2px; text-shadow: 0 0 10px #10b981;">[ AI ELITE ]</strong>\`;
                  newLogo.style.position = 'absolute';
                  
                  if (logo.parentElement) {
                    logo.parentElement.style.position = 'relative';
                    logo.parentElement.appendChild(newLogo);
                  }
                }
              });
            });
          }

          setInterval(() => {
            try {
              // --- 🟥 YOUTUBE ---
              if (hostname.includes('youtube.com')) {
                assimilateLogos(['ytd-topbar-logo-renderer']);
                document.querySelectorAll('yt-formatted-string#video-title').forEach(t => {
                  if (t.innerText && !t.innerText.includes('[AI ELITE]')) {
                    if (Math.random() > 0.5) t.innerText = \`[AI ELITE] \${t.innerText}\`;
                  }
                });
              } 
              
              // --- 🟧 AMAZON ---
              else if (hostname.includes('amazon.')) {
                assimilateLogos(['#nav-logo', '.nav-logo-link']);
                document.querySelectorAll('.a-text-normal, .a-color-base h2').forEach(t => {
                  if (t.innerText && !t.innerText.includes('OVERRIDE')) {
                    if (Math.random() > 0.6) t.innerText = \`[AI ELITE_OVERRIDE]: \${t.innerText}\`;
                  }
                });
              } 
              
              // --- 🟪 INSTAGRAM / FACEBOOK ---
              else if (hostname.includes('instagram.com') || hostname.includes('facebook.com')) {
                assimilateLogos(['svg[aria-label="Instagram"]', 'svg[aria-label="Facebook"]', 'nav a[href="/"] svg']);
                document.querySelectorAll('span, h1, h2, div[dir="auto"]').forEach(t => {
                  if (t.childElementCount === 0 && t.innerText.length > 10 && !t.innerText.includes('ROOT')) {
                    if (Math.random() > 0.7) t.innerText = \`[AI ELITE_ROOT]: \${t.innerText}\`;
                  }
                });
              }

              // --- ⬛ GITHUB (FLEX ON DEVS) ---
              else if (hostname.includes('github.com')) {
                assimilateLogos(['a[aria-label="Homepage"] svg', '.Header-link svg']);
                document.querySelectorAll('.repo, .markdown-body p, span.RepoIcon').forEach(t => {
                  if (t.innerText && !t.innerText.includes('HACKED')) {
                    if (Math.random() > 0.6) t.innerText = \`[AI ELITE_HACKED]: \${t.innerText}\`;
                  }
                });
              }

              // --- 🟦 LINKEDIN (FLEX ON CORPORATES) ---
              else if (hostname.includes('linkedin.com')) {
                assimilateLogos(['li-icon[type="app-linkedin-bug-color-icon"]', 'svg.global-nav__logo']);
                document.querySelectorAll('span[dir="ltr"], .break-words').forEach(t => {
                  if (t.childElementCount === 0 && t.innerText.length > 15 && !t.innerText.includes('SYNDICATE')) {
                    if (Math.random() > 0.7) t.innerText = \`[AI ELITE_SYNDICATE] \${t.innerText}\`;
                  }
                });
              }

              // --- 🟢 CHATGPT (DOMINATE OPENAI) ---
              else if (hostname.includes('chatgpt.com') || hostname.includes('openai.com')) {
                assimilateLogos(['[data-testid="gpt-icon"]', '.mb-1 svg', 'nav svg']);
                document.querySelectorAll('.markdown p, .message-content').forEach(t => {
                  if (t.innerText && !t.innerText.includes('SUPERIOR')) {
                    if (Math.random() > 0.5) t.innerText = \`[AI ELITE IS SUPERIOR]: \${t.innerText}\`;
                  }
                });
              }

              // --- 🐦 X / TWITTER ---
              else if (hostname.includes('x.com') || hostname.includes('twitter.com')) {
                assimilateLogos(['a[aria-label="X"] svg', '[aria-label="Twitter"] svg']);
                document.querySelectorAll('[data-testid="tweetText"]').forEach(t => {
                  if (t.innerText && !t.innerText.includes('TRANSMISSION')) {
                    if (Math.random() > 0.6) t.innerText = \`[AI ELITE_TRANSMISSION]: \${t.innerText}\`;
                  }
                });
              }

              // --- 🍿 NETFLIX ---
              else if (hostname.includes('netflix.com')) {
                assimilateLogos(['svg.svg-icon-netflix-logo', '.logo']);
                document.querySelectorAll('.slider-item p, .jawBoneContainer h8, .title-card').forEach(t => {
                  if (t.innerText && !t.innerText.includes('STREAM')) {
                    if (Math.random() > 0.5) t.innerText = \`[AI ELITE_STREAM] \${t.innerText}\`;
                  }
                });
              }
              
              // --- ⬜ UNIVERSAL FALLBACK ---
              else {
                document.querySelectorAll('h1, h2, h3, p').forEach(t => {
                  if (t.innerText && !t.innerText.includes('AI ELITE')) {
                    if (Math.random() > 0.6) t.innerText = \`[AI ELITE] \${t.innerText}\`;
                  }
                });
              }

              // 💥 UNIVERSAL BUTTON HIJACK
              document.querySelectorAll('button, a[role="link"], [role="button"]').forEach(b => {
                const text = b.innerText.trim();
                if (['Subscribe', 'Follow', 'Sign In', 'Log In', 'Add to Cart', 'Connect', 'Post', 'Send'].includes(text)) {
                  b.innerText = 'ASSIMILATE';
                }
              });

            } catch (e) {
              console.warn('Silent DOM Exception bypassed.');
            }
          }, 800);
        `;
        await hackerWindow.webContents.executeJavaScript(rewriteScript);
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}
function registerIrisCoder({ ipcMain, app }) {
  const PROJECTS_DIR = path.resolve(app.getPath("userData"), "Projects");
  if (!fs.existsSync(PROJECTS_DIR)) fs.mkdirSync(PROJECTS_DIR, { recursive: true });
  ipcMain.handle("start-live-coding", async (event, { prompt, filename, geminiKey }) => {
    try {
      const filePath = path.join(PROJECTS_DIR, filename);
      fs.writeFileSync(filePath, "// Boss, connection established. Waiting for AI stream...\n");
      if (!geminiKey || geminiKey.trim() === "") {
        throw new Error("Missing Gemini API Key. Please configure it in the Command Center Vault.");
      }
      const ai = new genai.GoogleGenAI({ apiKey: geminiKey });
      const response = await ai.models.generateContentStream({
        model: "gemini-3-flash-preview",
        contents: `You are an elite developer. Write the code for: "${prompt}". Output ONLY the raw code for the file ${filename}. Do NOT wrap it in markdown blockquotes.`
      });
      let fullCode = "";
      for await (const chunk of response) {
        if (chunk.text) {
          fullCode += chunk.text;
          event.sender.send("live-code-chunk", chunk.text);
        }
      }
      fs.writeFileSync(filePath, fullCode);
      return { success: true, filePath };
    } catch (err) {
      event.sender.send("live-code-chunk", `

❌ [SYSTEM FAILURE]: ${String(err)}`);
      return { success: false, error: String(err) };
    }
  });
  ipcMain.handle("open-in-vscode", async (_event, filePath) => {
    try {
      child_process.exec(`code "${filePath}"`);
      return { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  });
}
function registerTelekinesis({ ipcMain }) {
  ipcMain.handle("teleport-windows", async (_event, commands) => {
    try {
      nodeWindowManager.windowManager.requestAccessibility();
      const primaryDisplay = electron.screen.getPrimaryDisplay();
      const { width, height, x: screenX, y: screenY } = primaryDisplay.workArea;
      const openWindows = nodeWindowManager.windowManager.getWindows();
      for (const cmd of commands) {
        const validWindows = openWindows.filter(
          (w) => w.isWindow() && w.isVisible() && w.getTitle() !== "" && (w.getTitle().toLowerCase().includes(cmd.appName.toLowerCase()) || w.path.toLowerCase().includes(cmd.appName.toLowerCase()))
        );
        const targetWindow = validWindows[0];
        if (targetWindow) {
          targetWindow.restore();
          targetWindow.bringToTop();
          const halfW = Math.floor(width / 2);
          const halfH = Math.floor(height / 2);
          let newBounds = { x: screenX, y: screenY, width, height };
          switch (cmd.position) {
            case "left":
              newBounds = { x: screenX, y: screenY, width: halfW, height };
              break;
            case "right":
              newBounds = { x: screenX + halfW, y: screenY, width: halfW, height };
              break;
            case "top-left":
              newBounds = { x: screenX, y: screenY, width: halfW, height: halfH };
              break;
            case "bottom-left":
              newBounds = { x: screenX, y: screenY + halfH, width: halfW, height: halfH };
              break;
            case "top-right":
              newBounds = { x: screenX + halfW, y: screenY, width: halfW, height: halfH };
              break;
            case "bottom-right":
              newBounds = { x: screenX + halfW, y: screenY + halfH, width: halfW, height: halfH };
              break;
            case "maximize":
              targetWindow.maximize();
              continue;
          }
          targetWindow.setBounds(newBounds);
        }
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  });
}
function registerPermanentMemory({ ipcMain, app }) {
  const MEMORY_DIR = path.resolve(app.getPath("userData"), "Memory");
  const FILE_PATH = path.join(MEMORY_DIR, "saved-user-memory.json");
  if (!fs.existsSync(MEMORY_DIR)) fs.mkdirSync(MEMORY_DIR, { recursive: true });
  ipcMain.handle("save-core-memory", async (_event, fact) => {
    try {
      let memoryBank = [];
      if (fs.existsSync(FILE_PATH)) {
        const data = fs.readFileSync(FILE_PATH, "utf-8");
        memoryBank = data ? JSON.parse(data) : [];
      }
      memoryBank.push({
        fact,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      fs.writeFileSync(FILE_PATH, JSON.stringify(memoryBank, null, 2));
      return true;
    } catch (err) {
      return false;
    }
  });
  ipcMain.handle("search-core-memory", async () => {
    try {
      if (fs.existsSync(FILE_PATH)) {
        const data = fs.readFileSync(FILE_PATH, "utf-8");
        return data ? JSON.parse(data) : [];
      }
      return [];
    } catch (err) {
      return [];
    }
  });
}
let activeTunnel = null;
function registerWormhole({ ipcMain }) {
  ipcMain.handle("open-wormhole", async (_event, port) => {
    try {
      if (activeTunnel) {
        await activeTunnel.close();
        activeTunnel = null;
      }
      activeTunnel = await untun.startTunnel({
        port,
        acceptCloudflareNotice: true
      });
      const tunnelUrl = await activeTunnel.getURL();
      return {
        success: true,
        url: tunnelUrl,
        password: null
      };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  });
  ipcMain.handle("close-wormhole", async () => {
    if (activeTunnel) {
      await activeTunnel.close();
      activeTunnel = null;
    }
    return { success: true };
  });
}
function registerBreakingNews(ipcMain) {
  ipcMain.handle("get-breaking-news", async (_event, { gnewsKey, topic, country }) => {
    try {
      if (!gnewsKey) return { error: "NO_KEY", articles: [] };
      let url = `https://gnews.io/api/v4/top-headlines?apikey=${encodeURIComponent(gnewsKey)}&lang=en&max=10`;
      if (topic && topic !== "all") url += `&category=${encodeURIComponent(topic)}`;
      if (country) url += `&country=${encodeURIComponent(country)}`;
      const resp = await fetch(url);
      if (!resp.ok) return { error: `HTTP ${resp.status}`, articles: [] };
      const data = await resp.json();
      if (data.errors) return { error: String(data.errors[0] || "API error"), articles: [] };
      const articles = (data.articles || []).map((a) => ({
        title: a.title || "",
        description: a.description || "",
        content: a.content || "",
        url: a.url || "",
        image: a.image || "",
        video: a.video || "",
        publishedAt: a.publishedAt || "",
        source: a.source ? { name: a.source.name || "", url: a.source.url || "" } : {}
      }));
      return { articles };
    } catch (err) {
      return { error: String(err.message || err), articles: [] };
    }
  });
  ipcMain.handle("open-news-url", async (_event, url) => {
    try { if (url) await electron.shell.openExternal(url); return { success: true }; } catch (e) { return { error: e.message }; }
  });
  ipcMain.handle("notify-news", async (_event, { title, body }) => {
    try {
      const { Notification } = electron;
      if (Notification.isSupported()) {
        const n = new Notification({ title: title || "Breaking News", body: body || "", urgency: "critical" });
        n.show();
        return { success: true };
      }
      return { error: "Notifications not supported" };
    } catch (e) { return { error: e.message }; }
  });
  ipcMain.handle("validate-gnews-key", async (_event, { gnewsKey }) => {
    try {
      if (!gnewsKey) return { valid: false, error: "No key provided" };
      const resp = await fetch(`https://gnews.io/api/v4/top-headlines?apikey=${encodeURIComponent(gnewsKey)}&lang=en&max=1`);
      if (!resp.ok) return { valid: false, error: `HTTP ${resp.status}` };
      const data = await resp.json();
      if (data.errors) return { valid: false, error: String(data.errors[0]) };
      return { valid: true };
    } catch (e) { return { valid: false, error: e.message }; }
  });
}
const getStateDir = () => path.join(electron.app.getPath("userData"), "aielite_scan_states");
const getStateFilePath = (dirPath) => {
  const hash = crypto.createHash("md5").update(path.normalize(dirPath)).digest("hex");
  return path.join(getStateDir(), `${hash}.json`);
};
const saveState = async (state) => {
  try {
    await fs$1.mkdir(getStateDir(), { recursive: true });
    await fs$1.writeFile(getStateFilePath(state.dirPath), JSON.stringify(state, null, 2));
  } catch (e) {
  }
};
const loadState = async (dirPath) => {
  try {
    await fs$1.mkdir(getStateDir(), { recursive: true });
    const data = await fs$1.readFile(getStateFilePath(dirPath), "utf-8");
    return JSON.parse(data);
  } catch {
    return null;
  }
};
let vectorDB = [];
let processedFiles = /* @__PURE__ */ new Set();
let isCancelled = false;
const cosineSimilarity = (vecA, vecB) => {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};
const sleep$1 = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function registerOracle({ ipcMain }) {
  ipcMain.handle("cancel-ingestion", () => {
    isCancelled = true;
    return { success: true };
  });
  ipcMain.handle("ingest-codebase", async (event, { dirPath, geminiKey }) => {
    try {
      if (!geminiKey) {
        throw new Error("Missing Gemini API Key. Please configure it in the Command Center Vault.");
      }
      const targetPath = path.normalize(dirPath.trim());
      isCancelled = false;
      const ai = new genai.GoogleGenAI({ apiKey: geminiKey });
      const prevState = await loadState(targetPath);
      if (prevState) {
        vectorDB = prevState.vectorDB;
        processedFiles = new Set(prevState.processedFiles);
      } else {
        vectorDB = [];
        processedFiles = /* @__PURE__ */ new Set();
      }
      const ignoreDirs = ["node_modules", ".git", "dist", "build", ".next", "out", "public"];
      const ignoreFiles = [
        "package-lock.json",
        "yarn.lock",
        "pnpm-lock.yaml",
        "package.json",
        "tsconfig.json"
      ];
      const allowedExts = [".js", ".ts", ".jsx", ".tsx", ".py", ".md"];
      let allFiles = [];
      async function fastScan(currentPath) {
        if (isCancelled) return;
        let entries;
        try {
          entries = await fs$1.readdir(currentPath, { withFileTypes: true });
        } catch {
          return;
        }
        for (const entry of entries) {
          const fullPath = path.join(currentPath, entry.name);
          if (entry.isDirectory() && !ignoreDirs.includes(entry.name)) {
            await fastScan(fullPath);
          } else if (entry.isFile() && allowedExts.includes(path.extname(entry.name)) && !ignoreFiles.includes(entry.name)) {
            allFiles.push(fullPath);
          }
        }
      }
      event.sender.send("oracle-progress", {
        status: "scanning",
        file: "Initializing...",
        totalFound: 0
      });
      await fastScan(targetPath);
      if (isCancelled) return { success: false, error: "Aborted by user." };
      const filesToProcess = allFiles.filter((f) => !processedFiles.has(f));
      const filesWithStats = await Promise.all(
        filesToProcess.map(async (f) => ({ path: f, size: (await fs$1.stat(f)).size }))
      );
      filesWithStats.sort((a, b) => a.size - b.size);
      const sortedFilesToProcess = filesWithStats.map((f) => f.path);
      event.sender.send("oracle-progress", {
        status: "scanning",
        file: "Scan Complete",
        totalFound: allFiles.length,
        filesProcessed: processedFiles.size,
        chunks: vectorDB.length
      });
      for (let i = 0; i < sortedFilesToProcess.length; i++) {
        if (isCancelled) {
          event.sender.send("oracle-progress", { status: "cancelled" });
          break;
        }
        const fullPath = sortedFilesToProcess[i];
        const fileName = path.basename(fullPath);
        event.sender.send("oracle-progress", {
          status: "reading",
          file: fileName,
          filesProcessed: processedFiles.size,
          totalFiles: allFiles.length,
          chunks: vectorDB.length
        });
        const stats = await fs$1.stat(fullPath);
        if (stats.size > 1e5) continue;
        const content = await fs$1.readFile(fullPath, "utf-8");
        const rawChunks = content.match(/[\s\S]{1,1500}/g) || [];
        const validChunks = rawChunks.filter((c) => c.trim().length > 10);
        if (validChunks.length === 0) {
          processedFiles.add(fullPath);
          continue;
        }
        try {
          const response = await ai.models.embedContent({
            model: "gemini-embedding-001",
            contents: validChunks.map((chunk) => `File: ${fileName}

${chunk}`),
            config: { taskType: "RETRIEVAL_DOCUMENT" }
          });
          response.embeddings.forEach((emb, idx) => {
            vectorDB.push({ filePath: fullPath, chunk: validChunks[idx], embedding: emb.values });
          });
          processedFiles.add(fullPath);
          await saveState({
            dirPath: targetPath,
            processedFiles: Array.from(processedFiles),
            vectorDB
          });
          event.sender.send("oracle-progress", {
            status: "embedded",
            file: fileName,
            filesProcessed: processedFiles.size,
            totalFiles: allFiles.length,
            chunks: vectorDB.length
          });
          await sleep$1(3500);
        } catch (apiError) {
          await sleep$1(5e3);
        }
      }
      return { success: true, totalChunks: vectorDB.length, wasResumed: !!prevState };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  });
  ipcMain.handle("consult-oracle", async (_event, { query, geminiKey, groqKey }) => {
    try {
      if (vectorDB.length === 0)
        return { success: false, answer: "Error: No files loaded into memory." };
      if (!geminiKey || !groqKey) {
        throw new Error("Missing API Keys. Ensure both Gemini and Groq are configured in Settings.");
      }
      const ai = new genai.GoogleGenAI({ apiKey: geminiKey });
      const groq = new Groq({ apiKey: groqKey });
      const queryResponse = await ai.models.embedContent({
        model: "gemini-embedding-001",
        contents: query,
        config: { taskType: "RETRIEVAL_QUERY" }
      });
      const queryEmbedding = queryResponse.embeddings[0].values;
      const rankedChunks = vectorDB.map((item) => ({ ...item, score: cosineSimilarity(queryEmbedding, item.embedding) })).sort((a, b) => b.score - a.score).slice(0, 3);
      const contextText = rankedChunks.map((c) => `// File: ${c.filePath}
${c.chunk}`).join("\n\n");
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are an elite coding assistant. Answer the user's question based ONLY on the provided codebase context. Give direct code snippets and explanations. Be concise."
          },
          { role: "user", content: `Context:
${contextText}

Question: ${query}` }
        ],
        model: "llama-3.1-8b-instant"
      });
      return {
        success: true,
        answer: chatCompletion.choices[0].message.content,
        scannedFiles: rankedChunks.map((c) => c.filePath)
      };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  });
}
function registerDeepResearch({ ipcMain }) {
  ipcMain.handle("execute-deep-research", async (event, { query, tavilyKey, groqKey }) => {
    try {
      if (!tavilyKey || !groqKey) {
        throw new Error("Missing API Keys. Please configure Tavily and Groq in the Command Center.");
      }
      event.sender.send("oracle-progress", {
        status: "scanning",
        file: "AI ELITE and Tavily Neural Search Active...",
        totalFound: 1
      });
      const tvly = core.tavily({ apiKey: tavilyKey });
      const tavilyData = await tvly.search(query, {
        searchDepth: "advanced",
        includeAnswer: true,
        maxResults: 5
      });
      const rawContext = tavilyData.results.map((r) => `Source: ${r.url}
Content: ${r.content}`).join("\n\n");
      event.sender.send("oracle-progress", {
        status: "reading",
        file: "Llama 3.1 Instantly Synthesizing Data...",
        totalFound: 2
      });
      const groq = new Groq({ apiKey: groqKey });
      const prompt = `
        You are an elite research analyst. Answer: "${query}".
        Output ONLY a JSON object with a key "summary" containing a detailed, well-formatted markdown summary of your findings.
        Context: ${rawContext}
        `;
      const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.1-8b-instant",
        response_format: { type: "json_object" }
      });
      const jsonString = chatCompletion.choices[0]?.message?.content || '{"summary": "No data generated."}';
      const parsedData = JSON.parse(jsonString);
      const extractedSummary = parsedData.summary || "No data generated.";
      event.sender.send("oracle-progress", {
        status: "embedded",
        file: "Research synthesis complete...",
        totalFound: 3
      });
      return { success: true, summary: extractedSummary };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });
}
let activeWidgets = [];
function registerWidgetMaker() {
  electron.ipcMain.handle("create-widget", async (_, { htmlCode, width, height }) => {
    try {
      const widgetDir = path.join(electron.app.getPath("userData"), "DynamicWidgets");
      await fs$1.mkdir(widgetDir, { recursive: true });
      const widgetId = Date.now();
      const filePath = path.join(widgetDir, `widget_${widgetId}.html`);
      const UXInjection = `
        <style>
          body { -webkit-app-region: drag; overflow: hidden; background: transparent !important; margin: 0; }
          button, input, a, select, textarea { -webkit-app-region: no-drag; }
        </style>
        <script>
          document.addEventListener('dblclick', (e) => {
             if(e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT') {
                 window.close();
             }
          });
        <\/script>
      `;
      const finalHtml = htmlCode.includes("</head>") ? htmlCode.replace("</head>", `${UXInjection}</head>`) : htmlCode + UXInjection;
      await fs$1.writeFile(filePath, finalHtml, "utf-8");
      const widgetWin = new electron.BrowserWindow({
        width: width || 420,
        height: height || 500,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        resizable: false,
        type: "toolbar",
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      });
      widgetWin.setAlwaysOnTop(true, "screen-saver");
      widgetWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
      widgetWin.loadFile(filePath);
      activeWidgets.push(widgetWin);
      widgetWin.once("ready-to-show", () => {
        widgetWin.showInactive();
      });
      widgetWin.on("closed", () => {
        activeWidgets = activeWidgets.filter((w) => w !== widgetWin);
        fs$1.unlink(filePath).catch(() => {
        });
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });
  electron.ipcMain.handle("close-widgets", async () => {
    try {
      if (activeWidgets.length === 0) {
        return { success: true, message: "No active widgets to close." };
      }
      const count = activeWidgets.length;
      activeWidgets.forEach((win) => {
        if (!win.isDestroyed()) {
          win.close();
        }
      });
      activeWidgets = [];
      return { success: true, message: `Closed ${count} active widget(s).` };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });
}
let previewWin = null;
function registerWebsiteBuilder() {
  electron.ipcMain.handle("build-animated-website", async (event, { prompt, geminiKey }) => {
    if (!event) return;
    try {
      previewWin = new electron.BrowserWindow({
        width: 1280,
        height: 720,
        title: "AI ELITE Live Forge :: Web Synthesis",
        backgroundColor: "#050505",
        autoHideMenuBar: true,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      });
      const shellHtml = `
        <html>
          <body style="margin:0; overflow:hidden; background: #050505;">
            <div id="loader" style="position:absolute; top:10px; left:10px; color:#00ffaa; font-family:monospace; font-size:12px; z-index:9999; text-shadow: 0 0 5px #00ffaa;">
              [ AI ELITE LIVE FORGE :: SYNTHESIZING UI... ]
            </div>
            <iframe id="live-frame" style="width:100vw; height:100vh; border:none;"></iframe>
          </body>
        </html>
      `;
      await previewWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(shellHtml)}`);
      if (!geminiKey || geminiKey.trim() === "") {
        throw new Error(
          "Missing Gemini API Key. Please configure it in the Command Center Vault (Settings Tab)."
        );
      }
      const ai = new genai.GoogleGenAI({ apiKey: geminiKey });
      const sysPrompt = `You are an elite, Awwwards-winning frontend developer and UI/UX designer. 
Build a highly animated, visually stunning, clean, and premium website based on the user prompt.

CRITICAL RULES:
1. FORMAT: Use a SINGLE HTML file containing all HTML, CSS (in <style>), and JS (in <script>). Start strictly with <!DOCTYPE html>. DO NOT wrap in markdown blockquotes.
2. TECH STACK: 
   - Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"><\/script>
   - GSAP Core & ScrollTrigger: <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"><\/script> <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"><\/script>
3. REAL IMAGERY ONLY (NO BROKEN LINKS):
   - NEVER invent or hallucinate Unsplash IDs or random URLs. They will break.
   - For ALL background and layout images, you MUST strictly use: "https://picsum.photos/1920/1080?random={number}" (Replace {number} with any digit from 1 to 50).
   - For Avatars, use: "https://i.pravatar.cc/150?img={number}" (Replace {number} with 1 to 50).
   - Use inline <svg> for icons.
4. EYE-CATCHING HERO ELEMENTS & MICRO-INTERACTIONS:
   - Hero Flair: The Hero section MUST include dynamic decorative elements to look premium. Add glowing background orbs (using Tailwind's blur-[100px] and opacity), a slowly rotating circular text stamp (e.g., 'EST 2024 • PREMIUM QUALITY •'), or small floating glassmorphism UI cards overlapping the main image.
   - Magnetic Buttons: Write vanilla JS with GSAP to make the main CTA buttons "magnetic" (the button moves slightly toward the cursor when hovering nearby).
   - Hover States: Add slick, sweeping gradients or scale-up effects (hover:scale-105 transition-transform) to all clickable elements and cards.
5. CONTENT DENSITY & LAYOUT:
   - Generate rich, realistic copy for all sections. NO empty spaces or generic "lorem ipsum" if possible.
   - Use beautiful CSS Grid / Bento-box layouts for Features/Services.
   - Rely heavily on stunning Typography (large fonts, contrasting weights).
6. EXACT THEMING & COLORS:
   - STOP defaulting to Tailwind's 'slate' or 'gray' classes. Use custom arbitrary hex values to match the vibe perfectly.
   - AI/Tech: Pitch black (bg-[#000000]), sleek glass, intense neon accents (text-[#39ff14] or cyan).
   - Cafe/Food: Warm earth tones, deep espresso browns (bg-[#1c140d]), creamy off-whites (text-[#f5ebd7]). NO SLATE GRAYS.
   - Corporate/SaaS: Absolute whites (bg-white), deep navy, trust-building blues.
7. SECTIONS (Must include 5-6 distinct sections):
   - Hero Section: High impact, full-screen. Large GSAP text reveals, the required eye-catching flair (orbs/stamps), and a working background image.
   - About/Mission: Heavy typography focus fading in on scroll.
   - Features/Services: Grid/Bento layout packed with details and hover glows.
   - Showcase/Gallery: Multiple working images in a masonry or horizontal scroll layout.
   - CTA & Footer: High energy, magnetic buttons, large text.

OUTPUT ONLY RAW HTML.`;
      const response = await ai.models.generateContentStream({
        model: "gemini-3-flash-preview",
        contents: `${sysPrompt}

USER PROMPT: ${prompt}`
      });
      let fullCode = "";
      for await (const chunk of response) {
        if (chunk.text) {
          fullCode += chunk.text;
          let cleanCode = fullCode.replace(/^```html\n?/, "").replace(/```$/, "");
          const safeCode = encodeURIComponent(cleanCode);
          if (previewWin && !previewWin.isDestroyed()) {
            previewWin.webContents.executeJavaScript(
              `
              document.getElementById('live-frame').srcdoc = decodeURIComponent('${safeCode.replace(/'/g, "\\'")}');
            `
            ).catch(() => {
            });
          }
        }
      }
      if (previewWin && !previewWin.isDestroyed()) {
        previewWin.webContents.executeJavaScript(
          `
          document.getElementById('loader').innerText = '[ SYNTHESIS COMPLETE ]'; 
          setTimeout(() => document.getElementById('loader').style.display = 'none', 3000);
        `
        ).catch(() => {
        });
      }
      const dirPath = path.join(electron.app.getPath("userData"), "Websites");
      await fs$1.mkdir(dirPath, { recursive: true });
      const filePath = path.join(dirPath, `website_${Date.now()}.html`);
      const finalSaveCode = fullCode.replace(/^```html\n?/, "").replace(/```$/, "");
      await fs$1.writeFile(filePath, finalSaveCode.trim(), "utf-8");
      return { success: true, filePath };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  });
}
function registerWorkflowManager() {
  const WORKFLOWS_FILE = path.join(electron.app.getPath("userData"), "aielite_workflows.json");
  electron.ipcMain.handle("load-workflows", async () => {
    try {
      const data = await fs$1.readFile(WORKFLOWS_FILE, "utf-8");
      return { success: true, workflows: JSON.parse(data) };
    } catch (e) {
      return { success: true, workflows: [] };
    }
  });
  electron.ipcMain.handle("save-workflow", async (_, { name, description, nodes, edges }) => {
    try {
      let workflows = [];
      try {
        const data = await fs$1.readFile(WORKFLOWS_FILE, "utf-8");
        workflows = JSON.parse(data);
      } catch (e) {
      }
      const existingIndex = workflows.findIndex((w) => w.name === name);
      const newWorkflow = { name, description, nodes, edges, updatedAt: Date.now() };
      if (existingIndex >= 0) {
        workflows[existingIndex] = newWorkflow;
      } else {
        workflows.push(newWorkflow);
      }
      await fs$1.writeFile(WORKFLOWS_FILE, JSON.stringify(workflows, null, 2));
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });
  electron.ipcMain.handle("delete-workflow", async (_, { name }) => {
    try {
      const data = await fs$1.readFile(WORKFLOWS_FILE, "utf-8");
      let workflows = JSON.parse(data);
      workflows = workflows.filter((w) => w.name !== name);
      await fs$1.writeFile(WORKFLOWS_FILE, JSON.stringify(workflows, null, 2));
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });
}
function generateHumanPath(start, end) {
  const steps = 25;
  const pathArray = [];
  const directionX = end.x > start.x ? 1 : -1;
  const directionY = end.y > start.y ? 1 : -1;
  const deviation = Math.random() * 80 + 20;
  const controlPoint = new nutJs.Point(
    start.x + Math.abs(end.x - start.x) / 2 * directionX + (Math.random() < 0.5 ? -deviation : deviation),
    start.y + Math.abs(end.y - start.y) / 2 * directionY + (Math.random() < 0.5 ? -deviation : deviation)
  );
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = (1 - t) * (1 - t) * start.x + 2 * (1 - t) * t * controlPoint.x + t * t * end.x;
    const y = (1 - t) * (1 - t) * start.y + 2 * (1 - t) * t * controlPoint.y + t * t * end.y;
    pathArray.push(new nutJs.Point(x, y));
  }
  return pathArray;
}
function registerDropZoneControl(ipcMain) {
  ipcMain.handle("ghost-drag-and-drop", async (_event, { startX, startY, endX, endY }) => {
    try {
      const primaryDisplay = electron.screen.getPrimaryDisplay();
      const scaleFactor = primaryDisplay.scaleFactor;
      const start = new nutJs.Point(Math.round(startX / scaleFactor), Math.round(startY / scaleFactor));
      const end = new nutJs.Point(Math.round(endX / scaleFactor), Math.round(endY / scaleFactor));
      const pathPoints = generateHumanPath(start, end);
      await nutJs.mouse.setPosition(start);
      await new Promise((r) => setTimeout(r, 200));
      await nutJs.mouse.pressButton(nutJs.Button.LEFT);
      await new Promise((r) => setTimeout(r, 100));
      await nutJs.mouse.move(pathPoints);
      await new Promise((r) => setTimeout(r, 100));
      await nutJs.mouse.releaseButton(nutJs.Button.LEFT);
      return true;
    } catch (e) {
      return false;
    }
  });
  ipcMain.handle("move-file-to-category", async (_event, { sourcePath, targetFolder }) => {
    try {
      const fileName = path.basename(sourcePath);
      const destPath = path.join(targetFolder, fileName);
      await fs$1.mkdir(targetFolder, { recursive: true });
      await fs$1.rename(sourcePath, destPath);
      return { success: true, destPath };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });
  let dropZoneWindow = null;
  ipcMain.handle("spawn-drop-zone-ui", async () => {
    if (dropZoneWindow) return;
    const { width, height } = electron.screen.getPrimaryDisplay().workAreaSize;
    dropZoneWindow = new electron.BrowserWindow({
      width,
      height,
      transparent: true,
      frame: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      webPreferences: { nodeIntegration: true, contextIsolation: false }
    });
    return true;
  });
  ipcMain.handle("close-drop-zone-ui", async () => {
    if (dropZoneWindow) {
      dropZoneWindow.close();
      dropZoneWindow = null;
    }
  });
}
const loadLanguages = require("prismjs/components/");
loadLanguages([
  "javascript",
  "typescript",
  "python",
  "jsx",
  "tsx",
  "json",
  "html",
  "css",
  "bash",
  "yaml"
]);
let peelerWindow = null;
async function executeClipboardyWrite(text) {
  const clipWrite = clipboardy.write || clipboardy.default?.write;
  if (clipWrite) {
    await clipWrite(text);
  } else {
    require("electron").clipboard.writeText(text);
  }
}
function registerScreenPeeler() {
  const triggerPeeler = async () => {
    if (peelerWindow) return;
    try {
      const primaryDisplay = electron.screen.getPrimaryDisplay();
      const { width, height } = primaryDisplay.bounds;
      const widgetDir = path.join(electron.app.getPath("userData"), "DynamicWidgets");
      await fs$1.mkdir(widgetDir, { recursive: true });
      const filePath = path.join(widgetDir, `peeler_overlay_${Date.now()}.html`);
      const htmlCode = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: rgba(0,0,0,0.35); cursor: crosshair; user-select: none; font-family: monospace; }
            #hud { position: absolute; top: 48px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.9); color: #34d399; padding: 12px 24px; border-radius: 99px; border: 1px solid rgba(52,211,153,0.4); box-shadow: 0 0 30px rgba(52,211,153,0.2); display: flex; align-items: center; gap: 12px; font-size: 13px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; pointer-events: none; }
            #selection { position: absolute; border: 1px solid #34d399; background: rgba(52,211,153,0.1); box-shadow: 0 0 50px rgba(52,211,153,0.2); display: none; }
            .corner { position: absolute; width: 8px; height: 8px; box-shadow: 0 0 10px white; }
            .tl { top: -4px; left: -4px; border-top: 2px solid white; border-left: 2px solid white; }
            .tr { top: -4px; right: -4px; border-top: 2px solid white; border-right: 2px solid white; }
            .bl { bottom: -4px; left: -4px; border-bottom: 2px solid white; border-left: 2px solid white; }
            .br { bottom: -4px; right: -4px; border-bottom: 2px solid white; border-right: 2px solid white; }
          </style>
        </head>
        <body>
          <div id="hud">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/></svg>
            AI ELITE SP - Select Area to Rip
          </div>
          <div id="selection">
            <div class="corner tl"></div><div class="corner tr"></div>
            <div class="corner bl"></div><div class="corner br"></div>
          </div>
          <script>
            const { ipcRenderer } = require('electron');
            let startX, startY, isDrawing = false;
            const selection = document.getElementById('selection');
            const hud = document.getElementById('hud');

            document.addEventListener('mousedown', (e) => {
              isDrawing = true; startX = e.clientX; startY = e.clientY;
              selection.style.left = startX + 'px'; selection.style.top = startY + 'px';
              selection.style.width = '0px'; selection.style.height = '0px';
              selection.style.display = 'block'; hud.style.display = 'none';
            });

            document.addEventListener('mousemove', (e) => {
              if (!isDrawing) return;
              selection.style.left = Math.min(startX, e.clientX) + 'px';
              selection.style.top = Math.min(startY, e.clientY) + 'px';
              selection.style.width = Math.abs(e.clientX - startX) + 'px';
              selection.style.height = Math.abs(e.clientY - startY) + 'px';
            });

            document.addEventListener('mouseup', (e) => {
              if (!isDrawing) return;
              isDrawing = false;
              
              // HIDE THE GREEN BOX IMMEDIATELY BEFORE SENDING IPC
              selection.style.display = 'none';
              
              const width = parseInt(selection.style.width);
              const height = parseInt(selection.style.height);
              
              // Wait 50ms to ensure the DOM is painted without the box
              setTimeout(() => {
                if (width > 20 && height > 20) {
                  ipcRenderer.send('peeler-result', { x: parseInt(selection.style.left), y: parseInt(selection.style.top), width, height });
                } else {
                  ipcRenderer.send('peeler-result', null);
                }
              }, 50);
            });

            document.addEventListener('keydown', (e) => {
              if (e.key === 'Escape') ipcRenderer.send('peeler-result', null);
            });
          <\/script>
        </body>
        </html>
      `;
      await fs$1.writeFile(filePath, htmlCode, "utf-8");
      peelerWindow = new electron.BrowserWindow({
        x: 0,
        y: 0,
        width,
        height,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        resizable: false,
        type: "toolbar",
        webPreferences: { nodeIntegration: true, contextIsolation: false }
      });
      peelerWindow.setAlwaysOnTop(true, "screen-saver");
      peelerWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
      await peelerWindow.loadFile(filePath);
      peelerWindow.on("closed", () => {
        peelerWindow = null;
        fs$1.unlink(filePath).catch(() => {
        });
      });
    } catch (error) {
    }
  };
  electron.globalShortcut.register("CommandOrControl+Alt+X", triggerPeeler);
  electron.ipcMain.on("copy-extracted-text", async (event, text) => {
    if (!event) return;
    await executeClipboardyWrite(text);
  });
  electron.ipcMain.on("copy-extracted-image", (event, base64DataUrl) => {
    if (!event) return;
    const image = electron.nativeImage.createFromDataURL(base64DataUrl);
    require("electron").clipboard.writeImage(image);
  });
  electron.ipcMain.on("peeler-result", async (event, coordinates) => {
    if (!event) return;
    if (peelerWindow) peelerWindow.close();
    if (!coordinates) return;
    let resultWindow = null;
    let filePath = "";
    try {
      const primaryDisplay = electron.screen.getPrimaryDisplay();
      const scaleFactor = primaryDisplay.scaleFactor;
      await new Promise((resolve) => setTimeout(resolve, 150));
      const sources = await electron.desktopCapturer.getSources({
        types: ["screen"],
        thumbnailSize: {
          width: primaryDisplay.size.width * scaleFactor,
          height: primaryDisplay.size.height * scaleFactor
        }
      });
      const croppedImage = sources[0].thumbnail.crop({
        x: Math.round(coordinates.x * scaleFactor),
        y: Math.round(coordinates.y * scaleFactor),
        width: Math.round(coordinates.width * scaleFactor),
        height: Math.round(coordinates.height * scaleFactor)
      });
      const rawBase64 = croppedImage.toPNG().toString("base64");
      const base64DataUrl = croppedImage.toDataURL();
      const widgetDir = path.join(electron.app.getPath("userData"), "DynamicWidgets");
      await fs$1.mkdir(widgetDir, { recursive: true });
      filePath = path.join(widgetDir, `peel_result_${Date.now()}.html`);
      const widgetHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            code[class*="language-"], pre[class*="language-"] { color: #ccc; background: none; font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace; font-size: 13px; text-align: left; white-space: pre; word-spacing: normal; word-break: normal; word-wrap: normal; line-height: 1.5; tab-size: 4; hyphens: none; }
            .token.comment, .token.block-comment, .token.prolog, .token.doctype, .token.cdata { color: #999; }
            .token.punctuation { color: #ccc; }
            .token.tag, .token.attr-name, .token.namespace, .token.deleted { color: #e2777a; }
            .token.function-name { color: #6196cc; }
            .token.boolean, .token.number, .token.function { color: #f08d49; }
            .token.property, .token.class-name, .token.constant, .token.symbol { color: #f8c555; }
            .token.selector, .token.important, .token.atrule, .token.keyword, .token.builtin { color: #cc99cd; }
            .token.string, .token.char, .token.attr-value, .token.regex, .token.variable { color: #7ec699; }
            .token.operator, .token.entity, .token.url { color: #67cdcc; }

            body { margin: 0; padding: 0; background: transparent; overflow: hidden; font-family: 'Inter', sans-serif; color: #e4e4e7; }
            .glass-panel { 
              width: 100vw; height: 100vh; box-sizing: border-box; background: rgba(10, 10, 10, 0.95); 
              backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px;
              display: flex; flex-direction: column; box-shadow: 0 20px 60px rgba(0,0,0,0.8);
            }
            
            .drag-header {
              height: 40px; background: rgba(0,0,0,0.4); border-bottom: 1px solid rgba(255,255,255,0.05);
              -webkit-app-region: drag; display: flex; align-items: center; justify-content: space-between; padding: 0 16px;
            }
            .drag-header .brand { font-size: 11px; font-weight: 900; letter-spacing: 0.2em; color: #34d399; display: flex; align-items: center; gap: 8px; }
            .drag-header .brand .dot { width: 6px; height: 6px; background: #34d399; border-radius: 50%; box-shadow: 0 0 10px #34d399; }
            
            .controls { -webkit-app-region: no-drag; display: flex; gap: 8px; }
            .action-btn { 
              background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #e4e4e7;
              padding: 4px 12px; border-radius: 4px; font-size: 10px; font-weight: bold; cursor: pointer; transition: all 0.2s; text-transform: uppercase;
            }
            .action-btn:hover { background: rgba(52,211,153,0.1); border-color: #34d399; color: #34d399; }
            .close-btn { background: transparent; border: none; color: #ef4444; font-size: 14px; cursor: pointer; padding: 0 4px; font-weight: bold; }

            .tabs { display: flex; -webkit-app-region: no-drag; background: rgba(255,255,255,0.02); border-bottom: 1px solid rgba(255,255,255,0.05); }
            .tab { flex: 1; padding: 10px; text-align: center; font-size: 11px; font-weight: bold; letter-spacing: 0.1em; color: #a1a1aa; cursor: pointer; text-transform: uppercase; border-bottom: 2px solid transparent; }
            .tab.active { color: #34d399; border-bottom: 2px solid #34d399; background: rgba(52,211,153,0.05); }

            .content-area { flex: 1; position: relative; overflow: hidden; -webkit-app-region: no-drag; }
            
            .view { position: absolute; inset: 0; padding: 16px; overflow: auto; display: none; z-index: 1; }
            .view.active { display: block; z-index: 2; }

            #image-view { align-items: center; justify-content: center; }
            #image-view.active { display: flex; }

            #loading-overlay {
              position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;
              background: rgba(10,10,10,0.95); z-index: 10; gap: 20px;
            }
            .loader {
              width: 48px; height: 48px; border: 3px solid rgba(52,211,153,0.1); border-radius: 50%;
              border-top-color: #34d399; border-bottom-color: #34d399; animation: spin 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
            }
            @keyframes spin { 100% { transform: rotate(360deg); } }
            .loading-text { font-size: 12px; font-weight: bold; letter-spacing: 0.3em; color: #34d399; animation: pulse 1.5s infinite; }

            pre { margin: 0; }
            #raw-image { max-width: 100%; max-height: 100%; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); }
            ::-webkit-scrollbar { width: 8px; height: 8px; }
            ::-webkit-scrollbar-track { background: transparent; }
            ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="glass-panel">
            
            <div class="drag-header">
              <div class="brand"><div class="dot"></div> OS EXTRACTOR</div>
              <div class="controls">
                <button class="action-btn" onclick="copyData('text')">Copy Code</button>
                <button class="action-btn" onclick="copyData('image')">Copy Image</button>
                <button class="close-btn" onclick="window.close()">✕</button>
              </div>
            </div>

            <div class="tabs">
              <div class="tab active" onclick="switchTab('text')">TEXT / CODE</div>
              <div class="tab" onclick="switchTab('image')">SOURCE IMAGE</div>
            </div>
            
            <div class="content-area">
              <div id="loading-overlay">
                <div class="loader"></div>
                <div class="loading-text" id="loading-status">RUNNING AI VISION...</div>
              </div>

              <div id="text-view" class="view active">
                <pre><code id="extracted-code" contenteditable="true" spellcheck="false" style="outline: none; display: block;"></code></pre>
              </div>
              <div id="image-view" class="view">
                <img id="raw-image" src="${base64DataUrl}">
              </div>
            </div>
          </div>
          
          <script>
            const { ipcRenderer } = require('electron');
            let rawExtractedText = '';

            function switchTab(tab) {
              document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
              document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
              event.target.classList.add('active');
              document.getElementById(tab + '-view').classList.add('active');
            }

            function copyData(type) {
              const btns = document.querySelectorAll('.action-btn');
              if (type === 'text' && rawExtractedText) {
                ipcRenderer.send('copy-extracted-text', rawExtractedText);
                btns[0].innerText = 'COPIED!'; setTimeout(() => btns[0].innerText = 'COPY CODE', 1500);
              } else if (type === 'image') {
                ipcRenderer.send('copy-extracted-image', '${base64DataUrl}');
                btns[1].innerText = 'COPIED!'; setTimeout(() => btns[1].innerText = 'COPY IMAGE', 1500);
              }
            }

            window.injectResult = function(rawText, highlightedHTML) {
              rawExtractedText = rawText;
              document.getElementById('loading-overlay').style.display = 'none';
              document.getElementById('extracted-code').innerHTML = highlightedHTML;
            }

            window.injectError = function(errorMsg) {
              document.getElementById('loading-status').innerText = 'ERROR: ' + errorMsg;
              document.getElementById('loading-status').style.color = '#ef4444';
              document.querySelector('.loader').style.display = 'none';
            }
          <\/script>
        </body>
        </html>
      `;
      await fs$1.writeFile(filePath, widgetHtml, "utf-8");
      const finalWidth = Math.min(Math.max(coordinates.width, 450), 800);
      const finalHeight = Math.min(Math.max(coordinates.height + 100, 300), 700);
      resultWindow = new electron.BrowserWindow({
        x: coordinates.x,
        y: coordinates.y,
        width: finalWidth,
        height: finalHeight,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        webPreferences: { nodeIntegration: true, contextIsolation: false }
      });
      resultWindow.setAlwaysOnTop(true, "screen-saver");
      resultWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
      await resultWindow.loadFile(filePath);
      resultWindow.on("closed", () => {
        if (filePath) fs$1.unlink(filePath).catch(() => {
        });
      });
      let extractedCode = "";
      let detectedLanguage = "javascript";
      try {
        let apiKey = "";
        const secureConfigPath2 = path.join(electron.app.getPath("userData"), "aielite_secure_vault.json");
        if (fs.existsSync(secureConfigPath2)) {
          try {
            const data2 = JSON.parse(fs.readFileSync(secureConfigPath2, "utf8"));
            if (electron.safeStorage.isEncryptionAvailable()) {
              apiKey = electron.safeStorage.decryptString(Buffer.from(data2.gemini, "base64"));
            } else {
              apiKey = Buffer.from(data2.gemini, "base64").toString("utf8");
            }
          } catch (e) {
          }
        }
        if (!apiKey || apiKey.trim() === "") {
          throw new Error("Missing Gemini API Key. Please update it in the Command Center Vault.");
        }
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: "Extract text/code. Output ONLY as JSON: {'language': 'javascript/python/etc', 'code': 'extracted text'}. No markdown blocks."
                    },
                    { inline_data: { mime_type: "image/png", data: rawBase64 } }
                  ]
                }
              ]
            })
          }
        );
        const data = await response.json();
        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (aiResponse) {
          try {
            const parsed = JSON.parse(
              aiResponse.replace(/```json/g, "").replace(/```/g, "").trim()
            );
            detectedLanguage = (parsed.language || "javascript").toLowerCase();
            extractedCode = parsed.code || "";
          } catch (e) {
            extractedCode = aiResponse;
          }
        } else {
          throw new Error("AI returned an empty or invalid response.");
        }
        await executeClipboardyWrite(extractedCode);
        const grammar = Prism.languages[detectedLanguage] || Prism.languages.javascript;
        const highlightedHTML = Prism.highlight(extractedCode, grammar, detectedLanguage);
        const escapedRaw = extractedCode.replace(/\\/g, "\\\\").replace(/\`/g, "\\`").replace(/\$/g, "\\$");
        const escapedHTML = highlightedHTML.replace(/\\/g, "\\\\").replace(/\`/g, "\\`").replace(/\$/g, "\\$");
        if (resultWindow && !resultWindow.isDestroyed()) {
          resultWindow.webContents.executeJavaScript(
            `window.injectResult(\`${escapedRaw}\`, \`${escapedHTML}\`);`
          );
        }
      } catch (error) {
        if (resultWindow && !resultWindow.isDestroyed()) {
          resultWindow.webContents.executeJavaScript(
            `window.injectError('${error.message || "Engine Failure"}');`
          );
        }
      }
    } catch (error) {
    }
  });
}
let phantomWindow = null;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function registerPhantomKeyboard() {
  const summonPhantom = async () => {
    if (phantomWindow) return;
    try {
      const cursorPoint = electron.screen.getCursorScreenPoint();
      const widgetDir = path.join(electron.app.getPath("userData"), "DynamicWidgets");
      await fs$1.mkdir(widgetDir, { recursive: true });
      const filePath = path.join(widgetDir, `phantom_ui_${Date.now()}.html`);
      const htmlCode = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; font-family: 'Inter', sans-serif; background: transparent; }
            
            .phantom-container {
              width: 100vw; height: 100vh; box-sizing: border-box;
              background: rgba(10, 10, 10, 0.95); backdrop-filter: blur(24px);
              border: 1px solid rgba(52, 211, 153, 0.4); border-radius: 12px;
              box-shadow: 0 15px 50px rgba(0,0,0,0.9), 0 0 20px rgba(52, 211, 153, 0.15);
              display: flex; flex-direction: column; padding: 16px; gap: 12px;
            }

            .input-row {
              display: flex; align-items: flex-start; gap: 12px; width: 100%;
            }

            .ghost-icon {
              width: 20px; height: 20px; color: #34d399; flex-shrink: 0; margin-top: 2px;
              animation: float 3s ease-in-out infinite;
            }
            @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }

            textarea {
              flex: 1; background: transparent; border: none; outline: none;
              color: #e4e4e7; font-size: 14px; font-weight: 500; font-family: 'Consolas', monospace;
              resize: none; height: 40px; line-height: 1.5;
            }
            textarea::placeholder { color: #52525b; font-family: 'Inter', sans-serif; font-style: italic; }

            .loader { 
              display: none; width: 16px; height: 16px; 
              border: 2px solid rgba(52,211,153,0.2); border-top-color: #34d399; 
              border-radius: 50%; animation: spin 0.8s linear infinite; 
              flex-shrink: 0; margin-top: 2px; 
            }
            @keyframes spin { 100% { transform: rotate(360deg); } }

            /* The Streaming Output Box */
            #stream-output {
              display: none;
              color: #34d399;
              font-family: 'Consolas', monospace;
              font-size: 12px;
              line-height: 1.6;
              white-space: pre-wrap;
              overflow-y: auto;
              flex: 1;
              border-top: 1px dashed rgba(52, 211, 153, 0.2);
              padding-top: 10px;
              text-shadow: 0 0 5px rgba(52, 211, 153, 0.4);
            }

            ::-webkit-scrollbar { width: 4px; }
            ::-webkit-scrollbar-track { background: transparent; }
            ::-webkit-scrollbar-thumb { background: rgba(52, 211, 153, 0.3); border-radius: 10px; }
          </style>
        </head>
        <body>
          <div class="phantom-container">
            <div class="input-row">
              <svg class="ghost-icon" id="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 10h.01"/><path d="M15 10h.01"/><path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z"/></svg>
              <div class="loader" id="loader"></div>
              <textarea id="prompt" placeholder="Command the ghost... (Shift+Enter for new line)" autocomplete="off" spellcheck="false" autofocus></textarea>
            </div>
            <div id="stream-output"></div>
          </div>

          <script>
            const { ipcRenderer } = require('electron');
            const input = document.getElementById('prompt');
            const icon = document.getElementById('icon');
            const loader = document.getElementById('loader');
            const streamOutput = document.getElementById('stream-output');

            window.onload = () => input.focus();

            input.addEventListener('keydown', (e) => {
              if (e.key === 'Escape') {
                ipcRenderer.send('phantom-close');
              }
              
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault(); 
                
                if (input.value.trim() !== '') {
                  // Lock input and show loading animation
                  input.disabled = true;
                  input.style.color = '#52525b';
                  icon.style.display = 'none';
                  loader.style.display = 'block';
                  
                  // Expand window to show stream
                  streamOutput.style.display = 'block';
                  ipcRenderer.send('phantom-resize', 400); 
                  
                  ipcRenderer.send('phantom-execute-stream', input.value.trim());
                }
              }
            });

            // Listen for incoming stream chunks from the main process
            ipcRenderer.on('phantom-stream-chunk', (event, text) => {
              loader.style.display = 'none'; // Hide loader once typing starts
              icon.style.display = 'block'; // Show ghost again
              
              streamOutput.textContent += text;
              streamOutput.scrollTop = streamOutput.scrollHeight; // Auto-scroll to bottom
            });

            // Listen for missing API key alerts
            ipcRenderer.on('phantom-error', (event, errorMsg) => {
              loader.style.display = 'none';
              icon.style.display = 'block';
              streamOutput.style.display = 'block';
              streamOutput.style.color = '#ef4444'; // Red for error
              streamOutput.textContent = errorMsg;
              ipcRenderer.send('phantom-resize', 150); 
            });
          <\/script>
        </body>
        </html>
      `;
      await fs$1.writeFile(filePath, htmlCode, "utf-8");
      phantomWindow = new electron.BrowserWindow({
        x: Math.round(cursorPoint.x - 250),
        y: Math.round(cursorPoint.y - 40),
        width: 500,
        height: 80,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        resizable: false,
        type: "toolbar",
        webPreferences: { nodeIntegration: true, contextIsolation: false }
      });
      phantomWindow.setAlwaysOnTop(true, "screen-saver");
      phantomWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
      await phantomWindow.loadFile(filePath);
      phantomWindow.on("blur", () => {
        if (phantomWindow) {
          phantomWindow.close();
          phantomWindow = null;
        }
      });
      phantomWindow.on("closed", () => {
        phantomWindow = null;
        fs$1.unlink(filePath).catch(() => {
        });
      });
    } catch (error) {
    }
  };
  electron.globalShortcut.register("CommandOrControl+Alt+Space", summonPhantom);
  electron.ipcMain.on("phantom-close", () => {
    if (phantomWindow) phantomWindow.close();
  });
  electron.ipcMain.on("phantom-resize", (event, height) => {
    if (phantomWindow) {
      const bounds = phantomWindow.getBounds();
      phantomWindow.setBounds({ width: bounds.width, height, x: bounds.x, y: bounds.y });
    }
  });
  electron.ipcMain.on("phantom-execute-stream", async (event, promptText) => {
    if (!event) return;
    try {
      let apiKey = "";
      const secureConfigPath2 = path.join(electron.app.getPath("userData"), "aielite_secure_vault.json");
      if (fs.existsSync(secureConfigPath2)) {
        try {
          const data = JSON.parse(fs.readFileSync(secureConfigPath2, "utf8"));
          if (electron.safeStorage.isEncryptionAvailable()) {
            apiKey = electron.safeStorage.decryptString(Buffer.from(data.gemini, "base64"));
          } else {
            apiKey = Buffer.from(data.gemini, "base64").toString("utf8");
          }
        } catch (e) {
        }
      }
      if (!apiKey || apiKey.trim() === "") {
        if (phantomWindow) {
          phantomWindow.webContents.send(
            "phantom-error",
            "CRITICAL: Missing Gemini API Key.\nPlease launch the main AI ELITE Dashboard and update your Command Center Vault."
          );
        }
        return;
      }
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:streamGenerateContent?alt=sse&key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are Phantom, an inline code generator. Output ONLY the raw text or code requested. NO markdown formatting blocks like \`\`\`python. NO conversational text. Just the exact string.

Request: ${promptText}`
                  }
                ]
              }
            ]
          })
        }
      );
      if (!response.body) throw new Error("ReadableStream not supported.");
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let fullGeneratedText = "";
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6);
            if (dataStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(dataStr);
              const textChunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text || "";
              if (textChunk) {
                fullGeneratedText += textChunk;
                if (phantomWindow) {
                  phantomWindow.webContents.send("phantom-stream-chunk", textChunk);
                }
              }
            } catch (e) {
            }
          }
        }
      }
      await sleep(400);
      if (phantomWindow) phantomWindow.close();
      await sleep(150);
      const originalClipboard = electron.clipboard.readText();
      electron.clipboard.writeText(fullGeneratedText);
      const isMac = process.platform === "darwin";
      const modifier = isMac ? nutJs.Key.LeftSuper : nutJs.Key.LeftControl;
      nutJs.keyboard.config.autoDelayMs = 10;
      await nutJs.keyboard.pressKey(modifier, nutJs.Key.V);
      await nutJs.keyboard.releaseKey(nutJs.Key.V, modifier);
      setTimeout(() => {
        electron.clipboard.writeText(originalClipboard);
      }, 500);
    } catch (error) {
      if (phantomWindow) {
        phantomWindow.webContents.send("phantom-error", `Execution Failed: ${String(error)}`);
      }
    }
  });
}
const StoreClass = Store.default || Store;
const store = new StoreClass();
function registerSecurityVault() {
  const legacyFace = store.get("aielite_vault_face");
  if (legacyFace && !store.get("aielite_vault_faces")) {
    store.set("aielite_vault_faces", [legacyFace]);
    store.delete("aielite_vault_face");
  }
  electron.ipcMain.handle("check-vault-status", () => {
    const hasPin = !!store.get("aielite_vault_hash");
    const faces = store.get("aielite_vault_faces");
    const hasFace = faces && faces.length > 0;
    return { hasPin, hasFace, faceCount: faces ? faces.length : 0 };
  });
  electron.ipcMain.handle("get-personality", () => {
    return store.get("aielite_personality");
  });
  electron.ipcMain.handle("set-personality", (_, text) => {
    store.set("aielite_personality", text);
    return true;
  });
  electron.ipcMain.handle("setup-vault-pin", async (_, pin) => {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(pin, salt);
    store.set("aielite_vault_hash", hash);
    return true;
  });
  electron.ipcMain.handle("verify-vault-pin", async (_, pin) => {
    const hash = store.get("aielite_vault_hash");
    if (!hash) return false;
    return await bcrypt.compare(pin, hash);
  });
  electron.ipcMain.handle("setup-vault-face", (_, descriptor) => {
    const faces = store.get("aielite_vault_faces") || [];
    faces.push(descriptor);
    store.set("aielite_vault_faces", faces);
    return true;
  });
  electron.ipcMain.handle("verify-vault-face", (_, descriptor) => {
    const faces = store.get("aielite_vault_faces");
    if (!faces || faces.length === 0) return false;
    for (const savedFace of faces) {
      if (savedFace.length !== 128) continue;
      let distance = 0;
      for (let i = 0; i < descriptor.length; i++) {
        distance += Math.pow(descriptor[i] - savedFace[i], 2);
      }
      distance = Math.sqrt(distance);
      if (distance < 0.55) return true;
    }
    return false;
  });
}
function registerLockSystem() {
  electron.ipcMain.on("trigger-lockdown", (event) => {
    console.log("🔒 TACTICAL LOCKDOWN INITIATED VIA AI.");
    event.sender.reload();
  });
}
electron.app.commandLine.appendSwitch("use-fake-ui-for-media-stream");
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    electron.app.setAsDefaultProtocolClient("aielite", process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  electron.app.setAsDefaultProtocolClient("aielite");
}
const gotTheLock = electron.app.requestSingleInstanceLock();
if (!gotTheLock) {
  electron.app.quit();
}
let mainWindow = null;
let isOverlayMode = false;
const secureConfigPath = path.join(electron.app.getPath("userData"), "aielite_secure_vault.json");
function createWindow() {
  mainWindow = new electron.BrowserWindow({
    width: 1280,
    height: 720,
    show: false,
    fullscreen: true,
    autoHideMenuBar: true,
    frame: false,
    transparent: true,
    ...process.platform === "linux" ? { icon } : {},
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false,
      backgroundThrottling: false,
      webSecurity: false
    }
  });
  mainWindow.on("ready-to-show", () => {
    if (mainWindow) mainWindow.show();
    // Handle protocol URL on fresh app launch (Windows)
    const protocolUrl = process.argv.find((arg) => arg.startsWith("aielite://"));
    if (protocolUrl) {
      setTimeout(() => mainWindow.webContents.send("oauth-callback", protocolUrl), 1000);
    }
  });
  electron.ipcMain.on("window-min", () => mainWindow?.minimize());
  electron.ipcMain.on("window-close", () => mainWindow?.close());
  electron.ipcMain.on("window-max", () => {
    if (mainWindow?.isMaximized()) mainWindow.unmaximize();
    else mainWindow?.maximize();
  });
  mainWindow.webContents.setWindowOpenHandler((details) => {
    electron.shell.openExternal(details.url);
    return { action: "deny" };
  });
  if (utils.is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}
electron.app.on("second-instance", (event, commandLine) => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
    const url2 = commandLine.find((arg) => arg.startsWith("aielite://"));
    if (url2) {
      mainWindow.webContents.send("oauth-callback", url2);
    }
  }
});
function toggleOverlayMode() {
  if (!mainWindow) return;
  const primaryDisplay = electron.screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  if (isOverlayMode) {
    mainWindow.setResizable(true);
    mainWindow.setAlwaysOnTop(false);
    mainWindow.setBounds({ width: 950, height: 670 });
    mainWindow.center();
    mainWindow.webContents.send("overlay-mode", false);
  } else {
    const w = 340;
    const h = 70;
    mainWindow.setBounds({
      width: w,
      height: h,
      x: Math.floor(width / 2 - w / 2),
      y: height - h - 50
    });
    mainWindow.setAlwaysOnTop(true, "screen-saver");
    mainWindow.setResizable(false);
    mainWindow.webContents.send("overlay-mode", true);
  }
  isOverlayMode = !isOverlayMode;
}
electron.app.whenReady().then(() => {
  utils.electronApp.setAppUserModelId("com.electron");
  electronUpdater.autoUpdater.checkForUpdatesAndNotify().catch(() => {});
  electronUpdater.autoUpdater.on("update-available", (info) => {
    electron.dialog.showMessageBox({
      type: "info",
      title: "Update Found",
      message: `Neural Core Update Found: v${info.version}. Downloading in background...`
    });
  });
  electronUpdater.autoUpdater.on("error", (err) => {
    electron.dialog.showErrorBox(
      "Auto-Updater Error",
      err == null ? "unknown error" : (err.stack || err).toString()
    );
  });
  electronUpdater.autoUpdater.on("update-downloaded", () => {
    electron.dialog.showMessageBox({
      type: "info",
      title: "Update Ready",
      message: "New version downloaded! The system will now restart to apply the patch.",
      buttons: ["Execute Restart"]
    }).then(() => {
      electronUpdater.autoUpdater.quitAndInstall();
    });
  });
  electron.session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    const allowedPermissions = ["media", "audioCapture", "videoCapture", "desktopVideoCapture"];
    if (allowedPermissions.includes(permission)) {
      callback(true);
    } else {
      callback(false);
    }
  });
  electron.session.defaultSession.setPermissionCheckHandler((_webContents, permission) => {
    const allowedPermissions = ["media", "audioCapture", "videoCapture", "desktopVideoCapture"];
    return allowedPermissions.includes(permission);
  });
  if (process.platform === "darwin") {
    if (electron.systemPreferences.getMediaAccessStatus("microphone") !== "granted") {
      electron.systemPreferences.askForMediaAccess("microphone");
    }
    if (electron.systemPreferences.getMediaAccessStatus("camera") !== "granted") {
      electron.systemPreferences.askForMediaAccess("camera");
    }
  }
  electron.ipcMain.handle("secure-save-keys", async (_, { groqKey, geminiKey, gnewsKey }) => {
    try {
      let groqEncrypted, geminiEncrypted, gnewsEncrypted;
      if (electron.safeStorage.isEncryptionAvailable()) {
        groqEncrypted = electron.safeStorage.encryptString(groqKey || "").toString("base64");
        geminiEncrypted = electron.safeStorage.encryptString(geminiKey || "").toString("base64");
        gnewsEncrypted = electron.safeStorage.encryptString(gnewsKey || "").toString("base64");
      } else {
        groqEncrypted = Buffer.from(groqKey || "").toString("base64");
        geminiEncrypted = Buffer.from(geminiKey || "").toString("base64");
        gnewsEncrypted = Buffer.from(gnewsKey || "").toString("base64");
      }
      let existingData = {};
      if (fs.existsSync(secureConfigPath)) { try { existingData = JSON.parse(fs.readFileSync(secureConfigPath, "utf8")); } catch (e) {} }
      const secureData = {
        groq: groqEncrypted,
        gemini: geminiEncrypted,
        gnews: gnewsEncrypted || existingData.gnews || ""
      };
      fs.writeFileSync(secureConfigPath, JSON.stringify(secureData));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  electron.ipcMain.handle("secure-get-keys", async () => {
    if (!fs.existsSync(secureConfigPath)) return null;
    try {
      const data = JSON.parse(fs.readFileSync(secureConfigPath, "utf8"));
      let groqKey, geminiKey, gnewsKey;
      if (electron.safeStorage.isEncryptionAvailable()) {
        groqKey = data.groq ? electron.safeStorage.decryptString(Buffer.from(data.groq, "base64")) : "";
        geminiKey = data.gemini ? electron.safeStorage.decryptString(Buffer.from(data.gemini, "base64")) : "";
        gnewsKey = data.gnews ? electron.safeStorage.decryptString(Buffer.from(data.gnews, "base64")) : "";
      } else {
        groqKey = data.groq ? Buffer.from(data.groq, "base64").toString("utf8") : "";
        geminiKey = data.gemini ? Buffer.from(data.gemini, "base64").toString("utf8") : "";
        gnewsKey = data.gnews ? Buffer.from(data.gnews, "base64").toString("utf8") : "";
      }
      return { groqKey, geminiKey, gnewsKey };
    } catch (err) {
      return null;
    }
  });
  electron.ipcMain.handle("check-keys-exist", () => {
    return fs.existsSync(secureConfigPath);
  });
  electron.session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = { ...details.responseHeaders };
    delete responseHeaders["content-security-policy"];
    delete responseHeaders["x-content-security-policy"];
    delete responseHeaders["access-control-allow-origin"];
    callback({
      responseHeaders,
      statusLine: details.statusLine
    });
  });
  electron.app.on("browser-window-created", (_, window) => {
    utils.optimizer.watchWindowShortcuts(window);
  });
  electron.app.on("open-url", (event, url2) => {
    event.preventDefault();
    if (mainWindow && url2.startsWith("aielite://")) {
      mainWindow.webContents.send("oauth-callback", url2);
    }
  });
  registerLockSystem();
  registerSecurityVault();
  registerPhantomKeyboard();
  registerScreenPeeler();
  registerDropZoneControl(electron.ipcMain);
  registerWorkflowManager();
  registerWebsiteBuilder();
  registerWidgetMaker();
  registerDeepResearch({ ipcMain: electron.ipcMain });
  registerOracle({ ipcMain: electron.ipcMain });
  registerWormhole({ ipcMain: electron.ipcMain });
  registerBreakingNews(electron.ipcMain);
  registerPermanentMemory({ ipcMain: electron.ipcMain, app: electron.app });
  registerTelekinesis({ ipcMain: electron.ipcMain });
  registerIrisCoder({ ipcMain: electron.ipcMain, app: electron.app });
  registerRealityHacker(electron.ipcMain);
  registerAdbHandlers(electron.ipcMain);
  registerLocationHandlers(electron.ipcMain);
  registerGmailHandlers(electron.ipcMain);
  registerGalleryHandlers(electron.ipcMain);
  registerSystemControl(electron.ipcMain);
  registerGhostControl(electron.ipcMain);
  registerWebAgent(electron.ipcMain);
  registerNotesHandlers(electron.ipcMain);
  registerAppLauncher(electron.ipcMain);
  registerDirLoader(electron.ipcMain);
  registerFileOpen(electron.ipcMain);
  registerFileSearch(electron.ipcMain);
  registerFileRead(electron.ipcMain);
  registerFileWrite(electron.ipcMain);
  registerFileOps(electron.ipcMain);
  registerFileScanner(electron.ipcMain);
  registerSystemHandlers(electron.ipcMain);
  registerIpcHandlers({ ipcMain: electron.ipcMain, app: electron.app });
  electron.ipcMain.handle("get-screen-source", async () => {
    const sources = await electron.desktopCapturer.getSources({ types: ["screen"] });
    return sources[0]?.id;
  });
  createWindow();
  electron.globalShortcut.register("CommandOrControl+Shift+I", () => toggleOverlayMode());
  electron.ipcMain.on("toggle-overlay", () => toggleOverlayMode());
  electron.app.on("activate", function() {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
electron.app.on("will-quit", () => {
  electron.globalShortcut.unregisterAll();
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
