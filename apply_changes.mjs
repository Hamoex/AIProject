import { readFileSync, writeFileSync } from 'fs';

// ===== REACT RENDERER BUNDLE =====
let code = readFileSync('out/renderer/assets/index-Py0GEyy8.js', 'utf-8');

// ============================================
// CHANGE 1: Remove website preview tool
// ============================================

// Remove the buildAnimatedWebsite function
code = code.replace(
  /const buildAnimatedWebsite = async \(prompt\) => \{[\s\S]*?\n\};\n/,
  ''
);

// Remove the tool definition
code = code.replace(
  /\{\s*name: "build_animated_website",[\s\S]*?required: \["prompt"\]\s*\}\s*\}\s*\},\n/,
  ''
);

// Remove the handler
code = code.replace(
  /else if \(call\.name === "build_animated_website"\) \{\s*result = await buildAnimatedWebsite\(call\.args\.prompt\);\s*\}/,
  ''
);

console.log('✓ Removed website preview tool');

// ============================================
// CHANGE 2: Fix breaking news UI
// ============================================

// Find the createNewsWidgetHTML function and replace it
const newsFuncStart = code.indexOf('const createNewsWidgetHTML = (articles, country, size) => {');
const newsFuncEnd = code.indexOf('\nconst createNewsWidget = async', newsFuncStart);

if (newsFuncStart !== -1 && newsFuncEnd !== -1) {
  const newNewsFunc = `const createNewsWidgetHTML = (articles, country, size) => {
  const sizeMap = { small: { w: 400, h: 400 }, medium: { w: 520, h: 600 }, large: { w: 620, h: 780 } };
  const s = sizeMap[size] || sizeMap.medium;
  const flag = country === 'palestine' ? '\\u{1F1F5}\\u{1F1F8}' : country === 'egypt' ? '\\u{1F1EA}\\u{1F1EC}' : country === 'usa' ? '\\u{1F1FA}\\u{1F1F8}' : '\\u{1F30D}';
  const countryName = country === 'palestine' ? 'Palestine' : country === 'egypt' ? 'Egypt' : country === 'usa' ? 'USA' : 'World';
  const sourceColors = { gnews: '#06b6d4', aljazeera: '#d4a006', almayadeen: '#e04040' };
  const sourceNames = { gnews: 'GNews', aljazeera: 'Al Jazeera', almayadeen: 'Al Mayadeen' };
  const articlesData = JSON.stringify(articles.slice(0, 12).map(a => ({
    title: a.title, description: a.description, url: a.url, image: a.image,
    source: a.source?.name || a._source, srcColor: sourceColors[a._source] || '#06b6d4',
    srcName: sourceNames[a._source] || a.source?.name || 'Unknown',
    published: a.publishedAt ? new Date(a.publishedAt).toLocaleString() : '',
    hasVideo: a._hasVideo, videoUrl: a._hasVideo ? a.url : ''
  })));
  const sourceIndicators = Object.entries(NEWS_SOURCES).filter(([k,v]) => v.enabled).map(([k,v]) =>
    '<span style="display:inline-flex;align-items:center;gap:4px;font-size:8px;color:'+v.color+';"><span style="width:5px;height:5px;border-radius:50%;background:'+v.color+';"></span>'+v.name+'</span>'
  ).join(' <span style="color:#3f3f46;">|</span> ');
  var h = '';
  h += '<!DOCTYPE html><html><head><style>';
  h += '*{margin:0;padding:0;box-sizing:border-box;}';
  h += 'body{background:rgba(8,8,10,0.97);font-family:Segoe UI,system-ui,sans-serif;color:#e4e4e7;overflow:hidden;border-radius:16px;border:1px solid rgba(6,182,212,0.25);}';
  h += '.header{padding:14px 16px;border-bottom:1px solid rgba(6,182,212,0.2);display:flex;align-items:center;gap:10px;background:linear-gradient(135deg,rgba(6,182,212,0.08),rgba(212,160,6,0.05));}';
  h += '.flag{font-size:24px;}';
  h += '.title{font-size:14px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;background:linear-gradient(90deg,#06b6d4,#d4a006);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}';
  h += '.live{font-size:8px;color:#22c55e;font-weight:700;letter-spacing:2px;animation:blink 1.5s infinite;}';
  h += '@keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}';
  h += '.sources{padding:8px 16px;display:flex;align-items:center;gap:8px;border-bottom:1px solid rgba(6,182,212,0.1);background:rgba(0,0,0,0.4);}';
  h += '.news-list{overflow-y:auto;overflow-x:hidden;}';
  h += '.news-list::-webkit-scrollbar{width:4px;}';
  h += '.news-list::-webkit-scrollbar-thumb{background:rgba(6,182,212,0.25);border-radius:4px;}';
  h += '.article{display:flex;gap:12px;padding:14px 16px;border-bottom:1px solid rgba(6,182,212,0.08);cursor:pointer;transition:all 0.3s ease;}';
  h += '.article:hover{background:rgba(6,182,212,0.06);}';
  h += '.article-thumb{position:relative;width:110px;height:80px;min-width:110px;border-radius:8px;overflow:hidden;background:#111;}';
  h += '.article-thumb img{width:100%;height:100%;object-fit:cover;transition:transform 0.3s;}';
  h += '.article:hover .article-thumb img{transform:scale(1.05);}';
  h += '.video-play{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:32px;height:32px;background:rgba(224,64,64,0.9);border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 12px rgba(224,64,64,0.5);}';
  h += '.video-play::after{content:"";display:block;width:0;height:0;border-left:10px solid white;border-top:6px solid transparent;border-bottom:6px solid transparent;margin-left:2px;}';
  h += '.article-body{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:space-between;}';
  h += '.article-title{font-size:12px;font-weight:700;color:#e4e4e7;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}';
  h += '.article-desc{font-size:10px;color:#71717a;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-top:4px;}';
  h += '.article-meta{display:flex;align-items:center;gap:6px;margin-top:6px;}';
  h += '.src-dot{width:6px;height:6px;border-radius:50%;}';
  h += '.src-name{font-size:9px;font-weight:600;}';
  h += '.article-time{font-size:8px;color:#52525b;margin-left:auto;}';
  h += '.video-tag{display:inline-block;background:rgba(224,64,64,0.2);color:#ff6b6b;font-size:7px;font-weight:700;padding:1px 5px;border-radius:3px;letter-spacing:1px;border:1px solid rgba(224,64,64,0.3);}';
  h += '.msg-tag{display:inline-block;background:rgba(6,182,212,0.15);color:#06b6d4;font-size:7px;font-weight:700;padding:1px 5px;border-radius:3px;letter-spacing:1px;border:1px solid rgba(6,182,212,0.25);}';
  h += '.detail-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.96);z-index:9999;display:none;flex-direction:column;animation:fadeSlideIn 0.3s ease;}';
  h += '.detail-overlay.active{display:flex;}';
  h += '@keyframes fadeSlideIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}';
  h += '.detail-header{padding:12px 16px;display:flex;align-items:center;gap:10px;border-bottom:1px solid rgba(6,182,212,0.15);background:rgba(6,182,212,0.05);}';
  h += '.detail-back{background:rgba(6,182,212,0.15);border:1px solid rgba(6,182,212,0.3);color:#06b6d4;padding:6px 14px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;transition:all 0.2s;}';
  h += '.detail-back:hover{background:rgba(6,182,212,0.25);}';
  h += '.detail-content{flex:1;overflow-y:auto;padding:20px;}';
  h += '.detail-content::-webkit-scrollbar{width:4px;}';
  h += '.detail-content::-webkit-scrollbar-thumb{background:rgba(6,182,212,0.25);border-radius:4px;}';
  h += '.detail-media{position:relative;width:100%;border-radius:12px;overflow:hidden;margin-bottom:20px;background:#0a0a0c;}';
  h += '.detail-media img{width:100%;height:auto;max-height:300px;object-fit:cover;display:block;}';
  h += '.detail-media .video-overlay{position:absolute;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.4);cursor:pointer;}';
  h += '.detail-media .play-btn{width:56px;height:56px;background:rgba(224,64,64,0.9);border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 30px rgba(224,64,64,0.4);transition:transform 0.2s;}';
  h += '.detail-media .play-btn:hover{transform:scale(1.1);}';
  h += '.detail-media .play-btn::after{content:"";display:block;width:0;height:0;border-left:18px solid white;border-top:11px solid transparent;border-bottom:11px solid transparent;margin-left:4px;}';
  h += '.detail-title{font-size:18px;font-weight:800;color:#e4e4e7;line-height:1.6;margin-bottom:14px;}';
  h += '.detail-meta{display:flex;align-items:center;gap:10px;margin-bottom:18px;padding-bottom:14px;border-bottom:1px solid rgba(6,182,212,0.1);}';
  h += '.detail-msg{background:rgba(6,182,212,0.05);border:1px solid rgba(6,182,212,0.1);border-radius:10px;padding:16px;margin-bottom:18px;}';
  h += '.detail-msg-label{font-size:9px;font-weight:700;color:#06b6d4;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px;}';
  h += '.detail-msg-text{font-size:13px;color:#a1a1aa;line-height:1.9;}';
  h += '.detail-actions{display:flex;gap:10px;margin-top:16px;}';
  h += '.detail-open{display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg,rgba(6,182,212,0.2),rgba(168,85,247,0.2));border:1px solid rgba(6,182,212,0.4);color:#06b6d4;padding:10px 20px;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;transition:all 0.2s;letter-spacing:0.5px;text-decoration:none;}';
  h += '.detail-open:hover{background:linear-gradient(135deg,rgba(6,182,212,0.3),rgba(168,85,247,0.3));box-shadow:0 0 20px rgba(6,182,212,0.2);}';
  h += '.detail-share{display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#a1a1aa;padding:10px 16px;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer;transition:all 0.2s;}';
  h += '.detail-share:hover{background:rgba(255,255,255,0.1);color:#e4e4e7;}';
  h += '.footer{padding:10px 16px;text-align:center;font-size:9px;color:#52525b;border-top:1px solid rgba(6,182,212,0.1);display:flex;justify-content:space-between;align-items:center;}';
  h += '.footer span{color:#06b6d4;cursor:pointer;transition:color 0.2s;}';
  h += '.footer span:hover{color:#22d3ee;}';
  h += '.no-img{width:110px;height:80px;min-width:110px;border-radius:8px;background:linear-gradient(135deg,rgba(6,182,212,0.08),rgba(168,85,247,0.06));display:flex;align-items:center;justify-content:center;font-size:20px;}';
  h += '</style></head><body>';
  h += '<div class="header">';
  h += '<span class="flag">' + flag + '</span>';
  h += '<span class="title">' + countryName + ' Breaking News</span>';
  h += '<span class="live">\\u25CF LIVE</span>';
  h += '</div>';
  h += '<div class="sources">' + sourceIndicators + '</div>';
  h += '<div class="news-list" id="newsList"></div>';
  h += '<div class="detail-overlay" id="detailOverlay">';
  h += '<div class="detail-header">';
  h += '<button class="detail-back" onclick="closeDetail()">\\u2190 BACK</button>';
  h += '<span id="detailSource" style="font-size:10px;font-weight:700;"></span>';
  h += '</div>';
  h += '<div class="detail-content" id="detailContent"></div>';
  h += '</div>';
  h += '<div class="footer">';
  h += '<span onclick="location.reload()">\\u27F3 Refresh</span>';
  h += '<span id="articleCount">' + articles.length + ' articles</span>';
  h += '</div>';
  h += '<script>';
  h += 'var ARTICLES = ' + articlesData + ';';
  h += 'var listEl = document.getElementById("newsList");';
  h += 'var overlayEl = document.getElementById("detailOverlay");';
  h += 'var detailEl = document.getElementById("detailContent");';
  h += 'var detailSrc = document.getElementById("detailSource");';
  h += 'function renderList() {';
  h += '  if (!ARTICLES.length) { listEl.innerHTML = \\'<div style="padding:40px;text-align:center;color:#71717a;">No news available</div>\\'; return; }';
  h += '  listEl.innerHTML = ARTICLES.map(function(a, i) {';
  h += '    var imgHtml = a.image ? \\'<div class="article-thumb"><img src="\\' + a.image + \\'" onerror="this.parentElement.style.display=\\\\\\'none\\\\\\'">\\' + (a.hasVideo ? \\'<div class="video-play"></div>\\' : \\'\\') + \\'</div>\\' : \\'<div class="no-img">\\u{1F4F0}</div>\\';';
  h += '    var tags = \\'\\';';
  h += '    if (a.hasVideo) tags += \\'<span class="video-tag">\\u25B6 VIDEO</span> \\';';
  h += '    if (a.description && a.description.length > 20) tags += \\'<span class="msg-tag">\\u{1F4AC} STORY</span>\\';';
  h += '    return \\'<div class="article" onclick="showDetail(\\' + i + \\')">\\' + imgHtml +';
  h += '      \\'<div class="article-body">\\' +';
  h += '        \\'<div class="article-title">\\' + (a.title || \\'Untitled\\') + \\'</div>\\' +';
  h += '        \\'<div class="article-desc">\\' + (a.description || \\'No description available.\\') + \\'</div>\\' +';
  h += '        \\'<div class="article-meta">\\' +';
  h += '          \\'<span class="src-dot" style="background:\\' + a.srcColor + \\';"></span>\\' +';
  h += '          \\'<span class="src-name" style="color:\\' + a.srcColor + \\';">\\' + a.srcName + \\'</span>\\' +';
  h += '          tags +';
  h += '          \\'<span class="article-time">\\' + a.published + \\'</span>\\' +';
  h += '        \\'</div>\\' +';
  h += '      \\'</div></div>\\';';
  h += '  }).join(\\'\\');';
  h += '}';
  h += 'function showDetail(i) {';
  h += '  var a = ARTICLES[i];';
  h += '  if (!a) return;';
  h += '  detailSrc.textContent = a.srcName;';
  h += '  detailSrc.style.color = a.srcColor;';
  h += '  var html = \\'\\';';
  h += '  if (a.image) {';
  h += '    html += \\'<div class="detail-media"><img src="\\' + a.image + \\'" onerror="this.parentElement.style.display=\\\\\\'none\\\\\\'">\\' +';
  h += '      (a.hasVideo ? \\'<div class="video-overlay" onclick="window.open(\\\\\\'\\' + a.url + \\'\\\\\\', \\\\\\'_blank\\\\\\')"><div class="play-btn"></div></div>\\' : \\'\\') + \\'</div>\\';';
  h += '  }';
  h += '  html += \\'<div class="detail-title">\\' + (a.title || \\'No Title\\') + \\'</div>\\';';
  h += '  html += \\'<div class="detail-meta"><span style="width:7px;height:7px;border-radius:50%;background:\\' + a.srcColor + \\';"></span><span style="font-size:11px;color:\\' + a.srcColor + \\';font-weight:700;">\\' + a.srcName + \\'</span><span style="font-size:9px;color:#52525b;margin-left:auto;">\\' + a.published + \\'</span></div>\\';';
  h += '  if (a.hasVideo) {';
  h += '    html += \\'<div style="display:flex;align-items:center;gap:6px;margin-bottom:16px;padding:8px 12px;background:rgba(224,64,64,0.08);border:1px solid rgba(224,64,64,0.15);border-radius:8px;"><span style="font-size:14px;">\\u{1F3AC}</span><span style="font-size:11px;color:#ff6b6b;font-weight:600;">Video Available</span><span style="font-size:9px;color:#71717a;margin-left:auto;">Click image or button to watch</span></div>\\';';
  h += '  }';
  h += '  if (a.description && a.description.length > 10) {';
  h += '    html += \\'<div class="detail-msg"><div class="detail-msg-label">Full Story</div><div class="detail-msg-text">\\' + a.description + \\'</div></div>\\';';
  h += '  }';
  h += '  html += \\'<div class="detail-actions"><a class="detail-open" href="\\' + a.url + \\'" target="_blank">READ FULL ARTICLE \\u2192</a><button class="detail-share" onclick="navigator.clipboard.writeText(\\\\\\'\\' + a.url + \\'\\\\\\').then(function(){this.textContent=\\\\\\'Copied!\\\\\\';setTimeout(function(){this.textContent=\\\\\\'Share Link\\\\\\'}.bind(this),2000)}.bind(this))">Share Link</button></div>\\';';
  h += '  detailEl.innerHTML = html;';
  h += '  overlayEl.classList.add(\\'active\\');';
  h += '}';
  h += 'function closeDetail() {';
  h += '  overlayEl.classList.remove(\\'active\\');';
  h += '}';
  h += 'overlayEl.addEventListener(\\'click\\', function(e) { if (e.target === overlayEl) closeDetail(); });';
  h += 'renderList();';
  h += '<\\/script>';
  h += '</body></html>';
  return h;
};`;

  code = code.substring(0, newsFuncStart) + newNewsFunc + code.substring(newsFuncEnd);
  console.log('✓ Updated breaking news UI');
} else {
  console.log('✗ Could not find createNewsWidgetHTML function');
}

// ============================================
// CHANGE 3: Enhance thinking mode
// ============================================

// Find and replace the thinking indicator JSX
const thinkingOld = `isThinking && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-start animate-in fade-in slide-in-from-left-2 duration-300", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[8px] font-mono mb-1 text-cyan-500/70", children: "AI ELITE" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-[95%] py-2.5 px-3 rounded-xl text-[11px] leading-relaxed border font-mono bg-cyan-500/5 border-cyan-500/15 text-cyan-300 rounded-bl-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce", style: { animationDelay: "0ms" } }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce", style: { animationDelay: "150ms" } }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce", style: { animationDelay: "300ms" } })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] text-cyan-500/60 tracking-widest animate-pulse", children: "THINKING..." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1.5 h-0.5 bg-cyan-500/10 rounded-full overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full", style: { width: "40%", animation: "shimmer 1.5s ease-in-out infinite" } }) })
        ] })
      ] })`;

const thinkingNew = `isThinking && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-start animate-in fade-in slide-in-from-left-2 duration-300", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[8px] font-mono mb-1 text-cyan-500/70", children: "AI ELITE" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-[95%] py-3 px-4 rounded-xl text-[11px] leading-relaxed border font-mono bg-gradient-to-r from-cyan-500/10 to-blue-500/5 border-cyan-500/25 text-cyan-300 rounded-bl-sm shadow-lg shadow-cyan-500/5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shadow-md shadow-cyan-500/20", children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "text-cyan-400 animate-pulse", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" }) }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-cyan-400 font-bold tracking-wider", children: "NEURAL PROCESSING" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-0.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-1 h-1 bg-cyan-400 rounded-full animate-bounce", style: { animationDelay: "0ms" } }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-1 h-1 bg-cyan-400 rounded-full animate-bounce", style: { animationDelay: "150ms" } }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-1 h-1 bg-cyan-400 rounded-full animate-bounce", style: { animationDelay: "300ms" } })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[8px] text-cyan-500/50 tracking-wide", children: "Analyzing request & generating response..." })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2.5 h-1 bg-cyan-500/10 rounded-full overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full bg-gradient-to-r from-cyan-500 via-blue-400 to-cyan-500 rounded-full", style: { width: "45%", animation: "shimmer 1.5s ease-in-out infinite", backgroundSize: "200% 100%" } }) })
        ] })
      ] })`;

if (code.includes(thinkingOld)) {
  code = code.replace(thinkingOld, thinkingNew);
  console.log('✓ Enhanced thinking mode');
} else {
  console.log('✗ Could not find thinking mode JSX to replace');
}

// Write the modified renderer bundle
writeFileSync('out/renderer/assets/index-Py0GEyy8.js', code, 'utf-8');
console.log('✓ Wrote renderer bundle');

// ===== CSS: Add shimmer keyframe =====
let css = readFileSync('out/renderer/assets/index-H5O9alcM.css', 'utf-8');
if (!css.includes('@keyframes shimmer')) {
  css = css.replace(
    '@keyframes corner-pulse {\n  0%, 100% { opacity: 0.6; }\n  50% { opacity: 0.9; }\n}',
    '@keyframes corner-pulse {\n  0%, 100% { opacity: 0.6; }\n  50% { opacity: 0.9; }\n}\n\n@keyframes shimmer {\n  0% { background-position: 200% 0; }\n  100% { background-position: -200% 0; }\n}'
  );
  writeFileSync('out/renderer/assets/index-H5O9alcM.css', css, 'utf-8');
  console.log('✓ Added shimmer keyframe to CSS');
} else {
  console.log('- Shimmer keyframe already exists');
}

// ===== MAIN PROCESS: Remove website builder =====
let main = readFileSync('out/main/index.js', 'utf-8');
// Remove registerWebsiteBuilder function and call
main = main.replace(/let previewWin = null;\nfunction registerWebsiteBuilder\(\) \{[\s\S]*?\n\}\n/, '');
main = main.replace('  registerWebsiteBuilder();\n', '');
writeFileSync('out/main/index.js', main, 'utf-8');
console.log('✓ Removed website builder from main process');

console.log('\nAll changes applied successfully!');
