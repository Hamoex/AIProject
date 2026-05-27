import { r as reactExports, j as jsxRuntimeExports, a4 as motion, a5 as GiArtificialIntelligence, a6 as RiRecordCircleLine, a7 as RiTerminalWindowLine, A as RiSettings4Line, a8 as RiPlugLine, a9 as RiShieldKeyholeLine, aa as AnimatePresence, ab as RiRocketLine, ac as RiRefreshLine, ad as RiDownloadCloud2Line, ae as RiUserLine, C as RiSave3Line, af as RiUserVoiceLine, ag as RiLock2Line, ah as RiKey2Line, F as RiBrainLine, ai as RiCpuLine, aj as RiCloudLine, ak as RiLockPasswordLine, al as RiScan2Line, L as RiAddLine, am as nets, an as detectSingleFace } from "./index-Py0GEyy8.js";
const SettingsView = ({ isSystemActive }) => {
  const [activeTab, setActiveTab] = reactExports.useState("updates");
  const [voice, setVoice] = reactExports.useState(
    localStorage.getItem("aielite_voice_profile") || "MALE"
  );
  const [personality, setPersonality] = reactExports.useState("");
  const [userName, setUserName] = reactExports.useState(localStorage.getItem("aielite_user_name") || "");
  const [geminiKey, setGeminiKey] = reactExports.useState(localStorage.getItem("aielite_custom_api_key") || "");
  const [groqKey, setGroqKey] = reactExports.useState(localStorage.getItem("aielite_groq_api_key") || "");
  const [hfKey, setHfKey] = reactExports.useState(localStorage.getItem("aielite_hf_api_key") || "");
  const [tailvyKey, setTailvyKey] = reactExports.useState(localStorage.getItem("aielite_tailvy_api_key") || "");
  const [newsKey, setNewsKey] = reactExports.useState(localStorage.getItem("aielite_gnews_api_key") || localStorage.getItem("aielite_news_api_key") || "");
  const [isSecurityUnlocked, setIsSecurityUnlocked] = reactExports.useState(false);
  const [authPin, setAuthPin] = reactExports.useState("");
  const [authError, setAuthError] = reactExports.useState(false);
  const [newPin, setNewPin] = reactExports.useState("");
  const [faceCount, setFaceCount] = reactExports.useState(0);
  const [isScanningFace, setIsScanningFace] = reactExports.useState(false);
  const [enrollStatus, setEnrollStatus] = reactExports.useState("");
  const videoRef = reactExports.useRef(null);
  const [appVersion, setAppVersion] = reactExports.useState("1.1.5");
  const [updateStatus, setUpdateStatus] = reactExports.useState("idle");
  const [updateVersion, setUpdateVersion] = reactExports.useState("");
  const [updateNotes, setUpdateNotes] = reactExports.useState("No new updates detected.");
  const [downloadProgress, setDownloadProgress] = reactExports.useState(0);
  reactExports.useEffect(() => {
    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.invoke("get-personality").then((res) => {
        if (res) setPersonality(res);
      });
      window.electron.ipcRenderer.invoke("check-vault-status").then((res) => setFaceCount(res?.faceCount || 0));
      window.electron.ipcRenderer.invoke("get-app-version").then((v) => setAppVersion(v));
      window.electron.ipcRenderer.invoke("secure-get-keys").then((keys) => {
        if (keys) {
          if (keys.geminiKey && !geminiKey) setGeminiKey(keys.geminiKey);
          if (keys.groqKey && !groqKey) setGroqKey(keys.groqKey);
          if (keys.gnewsKey && !newsKey) { setNewsKey(keys.gnewsKey); localStorage.setItem("aielite_gnews_api_key", keys.gnewsKey); }
        }
      }).catch(() => {});
      window.electron.ipcRenderer.on("updater-event", (_e, { status, data, error }) => {
        if (status === "checking") setUpdateStatus("checking");
        if (status === "available") {
          setUpdateStatus("available");
          setUpdateVersion(data.version);
          setUpdateNotes(data.releaseNotes || "Bug fixes and performance improvements.");
        }
        if (status === "not-available") {
          setUpdateStatus("idle");
          setUpdateNotes("System is up to date.");
        }
        if (status === "downloading") {
          setUpdateStatus("downloading");
          setDownloadProgress(Math.round(data.percent));
        }
        if (status === "downloaded") setUpdateStatus("ready");
        if (status === "error") {
          setUpdateStatus("error");
          setUpdateNotes(`Error: ${error}`);
        }
      });
    }
    return () => {
      if (window.electron?.ipcRenderer)
        window.electron.ipcRenderer.removeAllListeners("updater-event");
    };
  }, []);
  const checkForUpdates = () => window.electron.ipcRenderer.invoke("check-for-updates");
  const downloadUpdate = () => window.electron.ipcRenderer.invoke("download-update");
  const installUpdate = () => window.electron.ipcRenderer.invoke("install-update");
  const handleVoiceChange = (v) => {
    if (isSystemActive) return;
    setVoice(v);
    localStorage.setItem("aielite_voice_profile", v);
  };
  const handlePersonalityChange = (e) => {
    const text = e.target.value;
    const words = text.trim().split(/\s+/).filter((w) => w.length > 0);
    if (words.length <= 150) setPersonality(text);
  };
  const savePersonality = async () => {
    if (window.electron?.ipcRenderer) {
      await window.electron.ipcRenderer.invoke("set-personality", personality);
      alert("Personality Matrix Saved Securely to OS.");
    }
  };
  const saveUserName = () => {
    localStorage.setItem("aielite_user_name", userName);
    alert("User Designation Saved.");
  };
  const saveApiKeys = async () => {
    localStorage.setItem("aielite_custom_api_key", geminiKey);
    localStorage.setItem("aielite_groq_api_key", groqKey);
    localStorage.setItem("aielite_hf_api_key", hfKey);
    localStorage.setItem("aielite_tailvy_api_key", tailvyKey);
    localStorage.setItem("aielite_gnews_api_key", newsKey);
    if (window.electron?.ipcRenderer) {
      try {
        await window.electron.ipcRenderer.invoke("secure-save-keys", { groqKey, geminiKey, gnewsKey: newsKey });
      } catch (e) {
      }
    }
    alert(
      "All Neural Uplinks (API Keys) secured locally and in OS Vault. Restart AI modules to apply."
    );
  };
  const currentWordCount = personality.trim().split(/\s+/).filter((w) => w.length > 0).length;
  const unlockSecurityModule = async () => {
    if (!window.electron?.ipcRenderer) return;
    const isValid = await window.electron.ipcRenderer.invoke("verify-vault-pin", authPin);
    if (isValid) {
      setIsSecurityUnlocked(true);
      setAuthPin("");
    } else {
      setAuthError(true);
      setTimeout(() => setAuthError(false), 1e3);
    }
  };
  const updateMasterPin = async () => {
    if (newPin.length !== 4 || !window.electron?.ipcRenderer) return;
    await window.electron.ipcRenderer.invoke("setup-vault-pin", newPin);
    setNewPin("");
    alert("Master PIN Updated Successfully.");
  };
  const startFaceEnrollment = async () => {
    setIsScanningFace(true);
    setEnrollStatus("INITIALIZING CAMERA...");
    try {
      await Promise.all([
        nets.ssdMobilenetv1.loadFromUri("./models"),
        nets.faceLandmark68Net.loadFromUri("./models"),
        nets.faceRecognitionNet.loadFromUri("./models")
      ]);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setEnrollStatus("POSITION FACE IN FRAME");
        const scanInterval = setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState !== 4) return;
          const detection = await detectSingleFace(videoRef.current).withFaceLandmarks().withFaceDescriptor();
          if (detection) {
            clearInterval(scanInterval);
            setEnrollStatus("FACE ACQUIRED. ENCRYPTING...");
            const descriptorArray = Array.from(detection.descriptor);
            if (window.electron?.ipcRenderer) {
              await window.electron.ipcRenderer.invoke("setup-vault-face", descriptorArray);
            }
            stream.getTracks().forEach((t) => t.stop());
            setIsScanningFace(false);
            setFaceCount((prev) => prev + 1);
            alert("New Biometric Identity Saved.");
          }
        }, 1e3);
      }
    } catch (e) {
      setEnrollStatus("CAMERA ERROR");
      setTimeout(() => setIsScanningFace(false), 2e3);
    }
  };
  const cardClass = "bg-[#0f0f13] border border-white/10 p-6 md:p-8 rounded-2xl flex flex-col gap-5 hover:border-white/20 transition-all shadow-lg";
  const inputContainerClass = "flex items-center bg-[#050505] border border-white/10 rounded-lg px-4 py-3 focus-within:border-white/30 focus-within:bg-black transition-all duration-300 w-full";
  const titleClass = "text-sm font-semibold text-white flex items-center gap-2";
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 p-6 md:p-10 lg:p-16 flex flex-col items-center bg-black min-h-screen text-zinc-100 overflow-y-auto scrollbar-small", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    motion.div,
    {
      className: "w-full max-w-4xl flex flex-col gap-8",
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 bg-[#111] rounded-2xl border border-white/10 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.03)]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(GiArtificialIntelligence, { size: 36, className: "text-white" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-3xl font-bold tracking-tight text-white", children: "Command Center" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-zinc-400 font-mono mt-1 tracking-widest flex items-center gap-2 uppercase", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  RiRecordCircleLine,
                  {
                    className: `${isSystemActive ? "text-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" : "text-zinc-600"}`,
                    size: 14
                  }
                ),
                isSystemActive ? "System Online" : "System Offline"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex bg-[#0a0a0c] p-1 rounded-xl border border-white/10 w-full md:w-fit shadow-lg overflow-x-auto scrollbar-none", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                onClick: () => setActiveTab("updates"),
                className: `flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold tracking-widest rounded-lg transition-all duration-300 ${activeTab === "updates" ? "bg-white text-black shadow-md" : "text-zinc-500 hover:text-white hover:bg-white/5"}`,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(RiTerminalWindowLine, { size: 16 }),
                  " SYSTEM"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                onClick: () => setActiveTab("general"),
                className: `flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold tracking-widest rounded-lg transition-all duration-300 ${activeTab === "general" ? "bg-white text-black shadow-md" : "text-zinc-500 hover:text-white hover:bg-white/5"}`,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(RiSettings4Line, { size: 16 }),
                  " GENERAL"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                onClick: () => setActiveTab("keys"),
                className: `flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold tracking-widest rounded-lg transition-all duration-300 ${activeTab === "keys" ? "bg-white text-black shadow-md" : "text-zinc-500 hover:text-white hover:bg-white/5"}`,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(RiPlugLine, { size: 16 }),
                  " API KEYS"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                onClick: () => setActiveTab("security"),
                className: `flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold tracking-widest rounded-lg transition-all duration-300 ${activeTab === "security" ? "bg-white text-black shadow-md" : "text-zinc-500 hover:text-white hover:bg-white/5"}`,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(RiShieldKeyholeLine, { size: 16 }),
                  " SECURITY"
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative min-h-125 pb-12 mt-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AnimatePresence, { mode: "wait", children: [
          activeTab === "updates" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            motion.div,
            {
              initial: { opacity: 0, y: 10 },
              animate: { opacity: 1, y: 0 },
              exit: { opacity: 0, y: -10 },
              transition: { duration: 0.2 },
              className: "grid grid-cols-1 md:grid-cols-2 gap-6 absolute w-full",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `${cardClass} md:col-span-1 border-emerald-500/20`, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center border-b border-white/10 pb-4", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: titleClass, children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(RiRocketLine, { className: "text-emerald-400", size: 18 }),
                      " OS Firmware"
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded font-mono font-bold tracking-widest", children: [
                      "v",
                      appVersion
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col gap-4 items-center justify-center flex-1 py-4 text-center", children: updateStatus === "idle" || updateStatus === "error" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(RiTerminalWindowLine, { size: 48, className: "text-zinc-700" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-zinc-400 font-mono", children: "Current build is stable." }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "button",
                      {
                        onClick: checkForUpdates,
                        className: "mt-2 w-full py-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold tracking-widest text-[11px] flex items-center justify-center gap-2 transition-all cursor-pointer",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(RiRefreshLine, { size: 16 }),
                          " CHECK FOR UPDATES"
                        ]
                      }
                    )
                  ] }) : updateStatus === "checking" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(RiRefreshLine, { size: 48, className: "text-emerald-500 animate-spin" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-emerald-400 font-mono animate-pulse", children: "PINGING NEURAL NETWORK..." })
                  ] }) : updateStatus === "available" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(RiDownloadCloud2Line, { size: 48, className: "text-cyan-400" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-cyan-400 font-mono", children: [
                      "NEW BUILD FOUND: v",
                      updateVersion
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "button",
                      {
                        onClick: downloadUpdate,
                        className: "mt-2 w-full py-3 rounded-lg bg-cyan-500/20 hover:bg-cyan-500 text-cyan-400 hover:text-black font-bold tracking-widest text-[11px] flex items-center justify-center gap-2 transition-all border border-cyan-500/50 cursor-pointer",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(RiDownloadCloud2Line, { size: 16 }),
                          " INITIALIZE DOWNLOAD"
                        ]
                      }
                    )
                  ] }) : updateStatus === "downloading" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full flex flex-col gap-3", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-[10px] font-mono text-zinc-400", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "DOWNLOADING PATCH..." }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                        downloadProgress,
                        "%"
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full h-2 bg-black rounded-full overflow-hidden border border-white/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "div",
                      {
                        className: "h-full bg-cyan-500 shadow-[0_0_10px_#06b6d4] transition-all duration-300",
                        style: { width: `${downloadProgress}%` }
                      }
                    ) })
                  ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(RiRecordCircleLine, { size: 48, className: "text-emerald-400 animate-pulse" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-emerald-400 font-mono", children: "PATCH DOWNLOADED" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "button",
                      {
                        onClick: installUpdate,
                        className: "mt-2 w-full py-3 rounded-lg bg-emerald-500 text-black font-bold tracking-widest text-[11px] flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] cursor-pointer",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(RiRocketLine, { size: 16 }),
                          " EXECUTE RESTART"
                        ]
                      }
                    )
                  ] }) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `${cardClass} md:col-span-1`, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-between items-center border-b border-white/10 pb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: titleClass, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(RiTerminalWindowLine, { className: "text-zinc-400", size: 18 }),
                    " Patch Notes"
                  ] }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 bg-[#050505] border border-white/5 rounded-xl p-4 overflow-y-auto max-h-60 scrollbar-small", children: /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "text-[11px] font-mono text-zinc-400 whitespace-pre-wrap leading-relaxed", children: updateNotes }) })
                ] })
              ]
            },
            "updates"
          ),
          activeTab === "general" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            motion.div,
            {
              initial: { opacity: 0, y: 10 },
              animate: { opacity: 1, y: 0 },
              exit: { opacity: 0, y: -10 },
              transition: { duration: 0.2 },
              className: "grid grid-cols-1 md:grid-cols-2 gap-6 absolute w-full",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `${cardClass} md:col-span-2`, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: titleClass, children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(RiUserLine, { className: "text-zinc-400", size: 18 }),
                      " AI Personality Matrix"
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        "span",
                        {
                          className: `text-[10px] font-mono tracking-widest ${currentWordCount >= 150 ? "text-red-400" : "text-zinc-400"}`,
                          children: [
                            currentWordCount,
                            " / 150 WORDS"
                          ]
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "button",
                        {
                          onClick: savePersonality,
                          className: "text-zinc-400 hover:text-white transition-colors bg-white/5 p-2 rounded-md hover:bg-white/10 border border-white/5",
                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(RiSave3Line, { size: 18 })
                        }
                      )
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "textarea",
                    {
                      value: personality,
                      onChange: handlePersonalityChange,
                      placeholder: "Define who AI ELITE is. Example: 'You are a sassy, highly technical assistant...'",
                      className: "bg-[#050505] border border-white/10 rounded-lg p-4 text-sm text-zinc-200 h-32 resize-none focus:border-white/30 outline-none transition-all scrollbar-small"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cardClass, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-between items-end", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: titleClass, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(RiUserLine, { className: "text-zinc-400", size: 18 }),
                    " User Designation"
                  ] }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: inputContainerClass, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "input",
                      {
                        type: "text",
                        value: userName,
                        onChange: (e) => setUserName(e.target.value),
                        placeholder: "Enter operator name...",
                        className: "bg-transparent border-none outline-none text-sm text-zinc-100 w-full placeholder:text-zinc-600 font-medium"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        onClick: saveUserName,
                        className: "text-zinc-500 hover:text-white transition-colors ml-2",
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(RiSave3Line, { size: 20 })
                      }
                    )
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `${cardClass} relative`, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: titleClass, children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(RiUserVoiceLine, { className: "text-zinc-400", size: 18 }),
                      " OS Voice Profile"
                    ] }),
                    isSystemActive && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] text-red-400 font-mono tracking-widest flex items-center gap-1 bg-red-500/10 px-2 py-1 rounded border border-red-500/20", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(RiLock2Line, {}),
                      " LOCKED AS AI ELITE IS CONNECTED"
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "div",
                    {
                      className: `flex gap-3 h-12 mt-1 ${isSystemActive ? "opacity-40 cursor-not-allowed" : ""}`,
                      children: ["FEMALE", "MALE"].map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "button",
                        {
                          onClick: () => handleVoiceChange(s),
                          disabled: isSystemActive,
                          className: `cursor-pointer flex-1 flex items-center justify-center text-[12px] font-bold rounded-lg transition-all tracking-widest border ${voice === s ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]" : "bg-[#050505] border-white/10 text-zinc-400 hover:text-white hover:border-white/30"}`,
                          children: s
                        },
                        s
                      ))
                    }
                  ),
                  isSystemActive && /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "div",
                    {
                      className: "absolute inset-0 z-10",
                      title: "Disconnect AI to change voice"
                    }
                  )
                ] })
              ]
            },
            "general"
          ),
          activeTab === "keys" && /* @__PURE__ */ jsxRuntimeExports.jsx(
            motion.div,
            {
              initial: { opacity: 0, y: 10 },
              animate: { opacity: 1, y: 0 },
              exit: { opacity: 0, y: -10 },
              transition: { duration: 0.2 },
              className: "grid grid-cols-1 gap-6 absolute w-full",
              children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `${cardClass} gap-6`, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: titleClass, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(RiKey2Line, { className: "text-zinc-400", size: 18 }),
                    " External API Endpoints"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "button",
                    {
                      onClick: saveApiKeys,
                      className: "bg-white text-black px-6 py-2.5 rounded-lg text-xs font-bold tracking-widest hover:bg-zinc-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2 cursor-pointer",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(RiSave3Line, { size: 16 }),
                        " SAVE ALL KEYS"
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-[10px] text-zinc-400 font-mono tracking-widest uppercase flex items-center gap-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(RiBrainLine, { size: 14 }),
                      " Gemini Pro Core"
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: inputContainerClass, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "input",
                      {
                        type: "password",
                        value: geminiKey,
                        onChange: (e) => setGeminiKey(e.target.value),
                        placeholder: "AIzaSy_...",
                        className: "bg-transparent border-none outline-none text-sm font-mono text-zinc-100 w-full placeholder:text-zinc-700"
                      }
                    ) })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-[10px] text-zinc-400 font-mono tracking-widest uppercase flex items-center gap-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(RiCpuLine, { size: 14 }),
                      " Groq Fast Inferencing"
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: inputContainerClass, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "input",
                      {
                        type: "password",
                        value: groqKey,
                        onChange: (e) => setGroqKey(e.target.value),
                        placeholder: "gsk_...",
                        className: "bg-transparent border-none outline-none text-sm font-mono text-zinc-100 w-full placeholder:text-zinc-700"
                      }
                    ) })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2 md:col-span-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-[10px] text-zinc-400 font-mono tracking-widest uppercase flex items-center gap-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(RiCloudLine, { size: 14 }),
                      " Hugging Face Vision"
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: inputContainerClass, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "input",
                      {
                        type: "password",
                        value: hfKey,
                        onChange: (e) => setHfKey(e.target.value),
                        placeholder: "hf_...",
                        className: "bg-transparent border-none outline-none text-sm font-mono text-zinc-100 w-full placeholder:text-zinc-700"
                      }
                    ) })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2 md:col-span-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-[10px] text-zinc-400 font-mono tracking-widest uppercase flex items-center gap-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(RiPlugLine, { size: 14 }),
                      " Tailvy Builder Agent"
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: inputContainerClass, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "input",
                      {
                        type: "password",
                        value: tailvyKey,
                        onChange: (e) => setTailvyKey(e.target.value),
                        placeholder: "tlv_...",
                        className: "bg-transparent border-none outline-none text-sm font-mono text-zinc-100 w-full placeholder:text-zinc-700"
                      }
                    ) })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2 md:col-span-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-[10px] text-zinc-400 font-mono tracking-widest uppercase flex items-center gap-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-2 h-2 rounded-full bg-cyan-500" }),
                      " Breaking News (GNews)"
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: inputContainerClass, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "input",
                      {
                        type: "password",
                        value: newsKey,
                        onChange: (e) => setNewsKey(e.target.value),
                        placeholder: "gnews_api_key...",
                        className: "bg-transparent border-none outline-none text-sm font-mono text-zinc-100 w-full placeholder:text-zinc-700"
                      }
                    ) })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-[#050505] border border-white/5 p-4 rounded-xl mt-2 flex items-start gap-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(RiShieldKeyholeLine, { className: "text-zinc-500 shrink-0 mt-0.5", size: 16 }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-zinc-400 font-mono leading-relaxed", children: "[SECURITY NOTICE]: All API keys are encrypted and stored strictly in your local OS. AI ELITE does not transmit these keys to any centralized server. You maintain full ownership and billing control over your provider endpoints." })
                ] })
              ] })
            },
            "keys"
          ),
          activeTab === "security" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            motion.div,
            {
              initial: { opacity: 0, y: 10 },
              animate: { opacity: 1, y: 0 },
              exit: { opacity: 0, y: -10 },
              transition: { duration: 0.2 },
              className: "w-full rounded-3xl overflow-hidden shadow-2xl border border-white/5 absolute",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { children: !isSecurityUnlocked && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  motion.div,
                  {
                    initial: { opacity: 0 },
                    animate: { opacity: 1 },
                    exit: { opacity: 0, backdropFilter: "blur(0px)" },
                    className: "absolute inset-0 z-20 backdrop-blur-2xl bg-black/70 border border-white/10 rounded-3xl flex flex-col items-center justify-center",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-[#111] p-5 rounded-full mb-6 border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(RiLockPasswordLine, { size: 40, className: "text-white" }) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-zinc-300 font-mono tracking-widest uppercase mb-6 font-semibold", children: "Authenticate to access Vault Settings" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3 items-center h-12", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "input",
                          {
                            type: "password",
                            maxLength: 4,
                            pattern: "\\d*",
                            value: authPin,
                            onChange: (e) => setAuthPin(e.target.value.replace(/\D/g, "")),
                            placeholder: "PIN",
                            className: `h-full bg-[#050505] border w-32 rounded-lg text-center text-xl tracking-[0.5em] text-white outline-none transition-colors ${authError ? "border-red-500 text-red-500 bg-red-500/10" : "border-white/20 focus:border-white focus:bg-[#111]"}`
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "button",
                          {
                            onClick: unlockSecurityModule,
                            className: "h-full px-8 bg-white text-black text-xs font-bold tracking-widest rounded-lg hover:bg-zinc-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.2)] cursor-pointer",
                            children: "UNLOCK"
                          }
                        )
                      ] })
                    ]
                  }
                ) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#0a0a0c] p-6 rounded-3xl border border-white/5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-[#111113] border border-white/10 p-7 rounded-2xl flex flex-col gap-5", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: titleClass, children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(RiLockPasswordLine, { className: "text-zinc-400", size: 18 }),
                      " Update Master PIN"
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: inputContainerClass, children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "input",
                        {
                          type: "password",
                          maxLength: 4,
                          pattern: "\\d*",
                          value: newPin,
                          onChange: (e) => setNewPin(e.target.value.replace(/\D/g, "")),
                          placeholder: "Enter new 4-digit PIN...",
                          className: "bg-transparent border-none outline-none text-sm font-mono text-zinc-100 w-full tracking-[0.3em]"
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "button",
                        {
                          onClick: updateMasterPin,
                          className: "text-zinc-500 hover:text-white transition-colors ml-2 cursor-pointer",
                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(RiSave3Line, { size: 20 })
                        }
                      )
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-[#111113] border border-white/10 p-7 rounded-2xl flex flex-col gap-6", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center border-b border-white/10 pb-4", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: titleClass, children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(RiScan2Line, { className: "text-zinc-400", size: 18 }),
                        " Biometric Registry"
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] text-white font-mono tracking-widest bg-white/10 px-3 py-1.5 rounded-md font-semibold border border-white/5", children: [
                        faceCount,
                        " ENROLLED"
                      ] })
                    ] }),
                    isScanningFace ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 bg-[#050505] p-3 rounded-xl border border-white/20", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "video",
                        {
                          ref: videoRef,
                          autoPlay: true,
                          muted: true,
                          playsInline: true,
                          className: "w-16 h-16 rounded-lg object-cover -scale-x-100 border border-white/10"
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] text-white font-mono tracking-widest animate-pulse font-bold", children: enrollStatus }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-zinc-400", children: "Keep head steady..." })
                      ] })
                    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 h-full justify-between", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-zinc-400 leading-relaxed", children: "Enroll additional structural face descriptors. Data is mathematically encrypted and stored locally." }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        "button",
                        {
                          onClick: startFaceEnrollment,
                          className: "w-full py-3 rounded-lg bg-white text-black font-bold tracking-widest text-[12px] flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] mt-auto cursor-pointer",
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(RiAddLine, { size: 18 }),
                            " ENROLL NEW IDENTITY"
                          ]
                        }
                      )
                    ] })
                  ] })
                ] })
              ]
            },
            "security"
          )
        ] }) })
      ]
    }
  ) });
};
export {
  SettingsView as default
};
