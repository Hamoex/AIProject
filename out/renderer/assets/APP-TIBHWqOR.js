import { r as reactExports, g as getAllApps, j as jsxRuntimeExports, R as RiAppsLine, a as RiTerminalBoxLine, b as RiChromeLine, c as RiCodeLine, d as RiSpotifyLine, e as RiDiscordLine, f as RiGamepadLine } from "./index-Py0GEyy8.js";
const SmartIcon = ({ name }) => {
  if (!name) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 bg-zinc-800 rounded-lg border border-white/5" });
  const lower = name.toLowerCase();
  let icon = /* @__PURE__ */ jsxRuntimeExports.jsx(RiTerminalBoxLine, { size: 20 });
  let color = "text-zinc-400";
  let bg = "bg-zinc-800";
  if (lower.includes("chrome") || lower.includes("edge")) {
    icon = /* @__PURE__ */ jsxRuntimeExports.jsx(RiChromeLine, { size: 20 });
    color = "text-blue-400";
    bg = "bg-blue-500/10";
  } else if (lower.includes("code") || lower.includes("dev")) {
    icon = /* @__PURE__ */ jsxRuntimeExports.jsx(RiCodeLine, { size: 20 });
    color = "text-cyan-400";
    bg = "bg-cyan-500/10";
  } else if (lower.includes("spotify") || lower.includes("music")) {
    icon = /* @__PURE__ */ jsxRuntimeExports.jsx(RiSpotifyLine, { size: 20 });
    color = "text-green-400";
    bg = "bg-green-500/10";
  } else if (lower.includes("discord") || lower.includes("telegram")) {
    icon = /* @__PURE__ */ jsxRuntimeExports.jsx(RiDiscordLine, { size: 20 });
    color = "text-indigo-400";
    bg = "bg-indigo-500/10";
  } else if (lower.includes("game") || lower.includes("launcher")) {
    icon = /* @__PURE__ */ jsxRuntimeExports.jsx(RiGamepadLine, { size: 20 });
    color = "text-purple-400";
    bg = "bg-purple-500/10";
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      className: `w-10 h-10 rounded-lg flex items-center justify-center border border-white/5 ${bg} ${color} shadow-sm group-hover:scale-110 transition-transform`,
      children: icon
    }
  );
};
const AppCard = ({ app }) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
  "div",
  {
    onClick: () => window.electron.ipcRenderer.invoke("open-app", app.name),
    className: "bg-zinc-950/40 backdrop-blur-xl border border-white/5 rounded-xl p-4 flex items-center gap-4 hover:bg-white/10 hover:border-emerald-500/30 transition-all cursor-pointer group active:scale-95",
    children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SmartIcon, { name: app.name }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 overflow-hidden", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-bold text-zinc-200 truncate group-hover:text-emerald-400 transition-colors", children: app.name }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[8px] text-zinc-600 truncate font-mono mt-1 opacity-70 group-hover:opacity-100", children: "INSTALLED" })
      ] })
    ]
  }
);
const AppsView = () => {
  const [allApps, setAllApps] = reactExports.useState([]);
  const [visibleApps, setVisibleApps] = reactExports.useState([]);
  const [page, setPage] = reactExports.useState(1);
  const [loading, setLoading] = reactExports.useState(true);
  const observer = reactExports.useRef(null);
  const lastAppElementRef = reactExports.useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && visibleApps.length < allApps.length) {
          setPage((prev) => prev + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, visibleApps.length, allApps.length]
  );
  reactExports.useEffect(() => {
    getAllApps().then((raw) => {
      const cleanData = (Array.isArray(raw) ? raw : []).filter(
        (item) => item && typeof item === "object" && item.name && item.id
      );
      setAllApps(cleanData);
      setVisibleApps(cleanData.slice(0, 15));
      setLoading(false);
    });
  }, []);
  reactExports.useEffect(() => {
    if (page > 1) {
      const nextBatch = allApps.slice(0, page * 12 + 6);
      setVisibleApps(nextBatch);
    }
  }, [page, allApps]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 bg-white/8 p-8 h-full flex flex-col animate-in fade-in zoom-in duration-300", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-6 shrink-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(RiAppsLine, { className: "text-emerald-400", size: 20 }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-bold text-zinc-200 tracking-widest", children: "SYSTEM APPLICATIONS" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-zinc-500 font-mono", children: "INDEXED SOFTWARE LIBRARY" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-mono text-emerald-500 bg-emerald-500/5 px-3 py-1 rounded-full border border-emerald-500/20", children: loading ? "INDEXING..." : `${allApps.length} FOUND` })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-y-auto pr-4 pb-4 scrollbar-small min-h-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3", children: [
      visibleApps.map((app, index) => {
        const safeKey = `${app.id}-${index}`;
        if (visibleApps.length === index + 1) {
          return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: lastAppElementRef, children: /* @__PURE__ */ jsxRuntimeExports.jsx(AppCard, { app }) }, safeKey);
        } else {
          return /* @__PURE__ */ jsxRuntimeExports.jsx(AppCard, { app }, safeKey);
        }
      }),
      loading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-zinc-500 text-xs p-4 text-center col-span-full", children: "Scanning System..." }),
      !loading && visibleApps.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-zinc-500 text-xs p-10 text-center col-span-full", children: "No Apps Found." })
    ] }) })
  ] });
};
export {
  AppsView as default
};
