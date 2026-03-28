"use client";
import { useState, useRef } from "react";

const MEAL_CONFIG = {
  breakfast: { label: "ארוחת בוקר",   icon: "🌅", color: "#f59e0b" },
  lunch:     { label: "ארוחת צהריים", icon: "🌿", color: "#10b981" },
  dinner:    { label: "ארוחת ערב",    icon: "🌙", color: "#6366f1" },
  extra:     { label: "נשנושים",      icon: "🍪", color: "#f43f5e" },
};

function getTodayStr() { return new Date().toISOString().split("T")[0]; }
function addDays(str, n) {
  const d = new Date(str + "T12:00:00"); d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}
function dateLabel(str) {
  const today = getTodayStr(), yest = addDays(today, -1);
  const d = new Date(str + "T12:00:00");
  const days = ["ראשון","שני","שלישי","רביעי","חמישי","שישי","שבת"];
  const fmt  = d.toLocaleDateString("he-IL", { day: "numeric", month: "long" });
  if (str === today) return { main: "היום",   sub: fmt + " · " + days[d.getDay()] };
  if (str === yest)  return { main: "אתמול", sub: fmt + " · " + days[d.getDay()] };
  return { main: fmt, sub: "יום " + days[d.getDay()] };
}
function loadDiary() {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem("nutri_v3") || "{}"); } catch { return {}; }
}
function saveDiary(d) { localStorage.setItem("nutri_v3", JSON.stringify(d)); }
function getDayData(diary, date) {
  return diary[date] || { breakfast: [], lunch: [], dinner: [], extra: [] };
}
function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = e => res({ b64: e.target.result.split(",")[1], mime: file.type });
    r.onerror = rej; r.readAsDataURL(file);
  });
}

// ─── STYLES ──────────────────────────────────────────────
const S = {
  nav: { background:"#fff", borderBottom:"1px solid #e8e2d9", padding:"0 20px", height:56, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:10, boxShadow:"0 1px 6px rgba(0,0,0,0.05)" },
  navLogo: { fontSize:18, fontWeight:900, color:"#2d5a27", display:"flex", alignItems:"center", gap:8 },
  navBtn: { background:"#e8f5e3", border:"1.5px solid #2d5a27", borderRadius:20, padding:"6px 14px", fontSize:12, fontWeight:700, cursor:"pointer", color:"#2d5a27" },
  wrap: { maxWidth:520, margin:"0 auto", padding:"16px 16px 80px" },
  dateNav: { background:"#fff", border:"1px solid #e8e2d9", borderRadius:18, padding:"12px 16px", marginBottom:14, display:"flex", alignItems:"center", justifyContent:"space-between" },
  arrow: { width:36, height:36, borderRadius:10, border:"1.5px solid #d4ccbf", background:"none", fontSize:16, cursor:"pointer" },
  totalsBar: { background:"#2d5a27", borderRadius:16, padding:"14px 16px", marginBottom:14, display:"flex", justifyContent:"space-between" },
  sectionWrap: { background:"#fff", border:"1px solid #e8e2d9", borderRadius:18, marginBottom:12, overflow:"hidden" },
  sectionHead: { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", background:"#fdfcfa", borderBottom:"1px solid #e8e2d9" },
  addBtn: { background:"none", border:"1.5px solid #d4ccbf", borderRadius:10, padding:"6px 14px", fontSize:12, fontWeight:700, cursor:"pointer", color:"#9a9188" },
  itemRow: { display:"flex", alignItems:"center", gap:12, padding:"10px 16px" },
  overlay: { position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"flex-end", justifyContent:"center", zIndex:200 },
  modal: { background:"#fff", borderRadius:"24px 24px 0 0", width:"100%", maxWidth:520, maxHeight:"92vh", overflowY:"auto", paddingBottom:36 },
  modalHead: { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 20px 12px", borderBottom:"1px solid #e8e2d9" },
  closeBtn: { width:30, height:30, borderRadius:"50%", border:"none", background:"#f7f4ef", cursor:"pointer", fontSize:16, color:"#9a9188", display:"flex", alignItems:"center", justifyContent:"center" },
  uploadZone: { border:"2px dashed #d4ccbf", borderRadius:16, padding:"28px 16px", textAlign:"center", cursor:"pointer", marginBottom:10, background:"#f7f4ef" },
  camBtn: { width:"100%", padding:12, border:"1.5px solid #d4ccbf", borderRadius:12, background:"#fff", fontSize:14, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:14 },
  analyzeBtn: { width:"100%", padding:14, background:"#2d5a27", border:"none", borderRadius:14, color:"#fff", fontSize:16, fontWeight:900, cursor:"pointer", marginBottom:12 },
  confirmBtn: { width:"100%", padding:14, background:"#2d5a27", border:"none", borderRadius:14, color:"#fff", fontSize:15, fontWeight:900, cursor:"pointer" },
  resultBox: { background:"#f7f4ef", border:"1px solid #e8e2d9", borderRadius:14, padding:14, marginBottom:12 },
  errorBox: { background:"#fff0f3", border:"1px solid #fecdd3", borderRadius:12, padding:"10px 14px", color:"#9f1239", fontSize:13, marginBottom:12 },
  macroGrid: { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginTop:12 },
  macroCard: { background:"#fff", border:"1px solid #e8e2d9", borderRadius:10, padding:"8px 6px", textAlign:"center" },
  journalCard: { background:"#fff", border:"1px solid #e8e2d9", borderRadius:16, padding:"14px 16px", marginBottom:10, cursor:"pointer" },
};

export default function App() {
  const [diary,    setDiary]    = useState(loadDiary);
  const [date,     setDate]     = useState(getTodayStr);
  const [modal,    setModal]    = useState(null);
  const [view,     setView]     = useState("day");
  const [imgSrc,   setImgSrc]   = useState(null);
  const [imgB64,   setImgB64]   = useState(null);
  const [imgMime,  setImgMime]  = useState("image/jpeg");
  const [loading,  setLoading]  = useState(false);
  const [pending,  setPending]  = useState(null);
  const [error,    setError]    = useState(null);
  const fileRef = useRef(), camRef = useRef();

  const day    = getDayData(diary, date);
  const totals = Object.values(day).flat().reduce(
    (a, i) => ({ cal: a.cal+(i.calories||0), prot: a.prot+(i.protein||0), carb: a.carb+(i.carbs||0), fat: a.fat+(i.fat||0) }),
    { cal:0, prot:0, carb:0, fat:0 }
  );

  function openModal(type) {
    setModal({ mealType: type }); setImgSrc(null); setImgB64(null);
    setPending(null); setError(null); setLoading(false);
  }

  async function handleFile(file) {
    if (!file || !file.type.startsWith("image/")) return;
    const { b64, mime } = await fileToBase64(file);
    setImgB64(b64); setImgMime(mime);
    setImgSrc(URL.createObjectURL(file));
    setPending(null); setError(null);
  }

  async function analyze() {
    setLoading(true); setError(null); setPending(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imgB64, mimeType: imgMime }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPending({ ...data, thumbnail: imgSrc, addedAt: new Date().toISOString() });
    } catch(e) {
      setError(e.message || "שגיאה. נסה שוב.");
    } finally { setLoading(false); }
  }

  function confirmAdd() {
    if (!pending || !modal) return;
    const updated = { ...diary };
    if (!updated[date]) updated[date] = { breakfast:[], lunch:[], dinner:[], extra:[] };
    updated[date][modal.mealType] = [...(updated[date][modal.mealType]||[]), pending];
    setDiary(updated); saveDiary(updated); setModal(null);
  }

  function deleteItem(type, idx) {
    const updated = { ...diary };
    updated[date][type] = updated[date][type].filter((_,i) => i !== idx);
    setDiary(updated); saveDiary(updated);
  }

  const dl    = dateLabel(date);
  const today = getTodayStr();

  // ── JOURNAL ──
  if (view === "journal") {
    const days = Object.keys(diary)
      .filter(d => Object.values(diary[d]).some(a => a.length > 0))
      .sort((a,b) => b.localeCompare(a));
    return (
      <div style={{ minHeight:"100vh", background:"#f7f4ef", paddingBottom:60 }}>
        <div style={{ ...S.nav }}>
          <span style={{ fontSize:17, fontWeight:700 }}>📖 היסטוריה</span>
          <button style={S.navBtn} onClick={() => setView("day")}>← חזרה</button>
        </div>
        <div style={S.wrap}>
          {days.length === 0 && (
            <div style={{ textAlign:"center", padding:60, color:"#9a9188" }}>
              <div style={{ fontSize:44, marginBottom:12 }}>📔</div>
              <div>עדיין אין ארוחות מתועדות</div>
            </div>
          )}
          {days.map(d => {
            const all = Object.values(diary[d]).flat();
            const cal = all.reduce((s,i) => s+(i.calories||0), 0);
            const dl2 = dateLabel(d);
            return (
              <div key={d} style={S.journalCard} onClick={() => { setDate(d); setView("day"); }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                  <div>
                    <div style={{ fontSize:15, fontWeight:700 }}>{dl2.main}</div>
                    <div style={{ fontSize:12, color:"#9a9188", marginTop:2 }}>{dl2.sub}</div>
                  </div>
                  <div><span style={{ fontSize:20, fontWeight:900, color:"#dc2626" }}>{cal}</span> <span style={{ fontSize:12, color:"#9a9188" }}>kcal</span></div>
                </div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {Object.entries(MEAL_CONFIG).map(([type, cfg]) => {
                    const items = diary[d][type]||[];
                    if (!items.length) return null;
                    const mc = items.reduce((s,i) => s+(i.calories||0),0);
                    return <span key={type} style={{ fontSize:11, padding:"3px 10px", borderRadius:20, fontWeight:700, background:cfg.color+"22", color:cfg.color }}>{cfg.icon} {cfg.label} · {mc} kcal</span>;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── DAY VIEW ──
  return (
    <div style={{ minHeight:"100vh", background:"#f7f4ef", paddingBottom:60 }}>

      <nav style={S.nav}>
        <div style={S.navLogo}><span>🥗</span> יומן תזונה</div>
        <button style={S.navBtn} onClick={() => setView("journal")}>📖 היסטוריה</button>
      </nav>

      <div style={S.wrap}>

        {/* DATE NAV */}
        <div style={S.dateNav}>
          <button style={{ ...S.arrow, opacity: date>=today ? 0.3 : 1 }} disabled={date>=today} onClick={() => setDate(d => addDays(d, 1))}>→</button>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:16, fontWeight:700 }}>{dl.main}</div>
            <div style={{ fontSize:12, color:"#9a9188", marginTop:2 }}>{dl.sub}</div>
          </div>
          <button style={S.arrow} onClick={() => setDate(d => addDays(d, -1))}>←</button>
        </div>

        {/* TOTALS */}
        <div style={S.totalsBar}>
          {[{v:totals.cal,l:"קלוריות"},{v:totals.prot,l:"חלבון g"},{v:totals.carb,l:"פחמימות g"},{v:totals.fat,l:"שומן g"}].map((t,i) => (
            <div key={i} style={{ textAlign:"center", flex:1 }}>
              <div style={{ fontSize:20, fontWeight:900, color:"#fff" }}>{t.v}</div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.6)", marginTop:3, textTransform:"uppercase", letterSpacing:"0.4px" }}>{t.l}</div>
            </div>
          ))}
        </div>

        {/* MEALS */}
        {Object.entries(MEAL_CONFIG).map(([type, cfg]) => {
          const items = day[type]||[];
          const mCal  = items.reduce((s,i) => s+(i.calories||0), 0);
          return (
            <div key={type} style={S.sectionWrap}>
              <div style={{ ...S.sectionHead, borderBottom: items.length ? "1px solid #e8e2d9" : "none" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:cfg.color }} />
                  <div>
                    <div style={{ fontSize:14, fontWeight:700 }}>{cfg.icon} {cfg.label}</div>
                    <div style={{ fontSize:11, color:"#9a9188", marginTop:1 }}>{mCal} kcal</div>
                  </div>
                </div>
                <button style={S.addBtn} onClick={() => openModal(type)}>+ הוסף</button>
              </div>
              {items.length === 0
                ? <div style={{ padding:"14px 16px", fontSize:13, color:"#9a9188", textAlign:"center" }}>טרם נוסף {cfg.icon}</div>
                : items.map((item, idx) => (
                  <div key={idx} style={{ ...S.itemRow, borderBottom: idx<items.length-1 ? "1px solid #e8e2d9" : "none" }}>
                    {item.thumbnail
                      ? <img src={item.thumbnail} alt="" style={{ width:44, height:44, borderRadius:10, objectFit:"cover", flexShrink:0 }} />
                      : <div style={{ width:44, height:44, borderRadius:10, background:"#f7f4ef", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{item.emoji}</div>
                    }
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:14, fontWeight:700, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{item.dish || item.name}</div>
                      <div style={{ fontSize:11, color:"#9a9188", marginTop:1 }}>{item.protein}g חלבון · {item.carbs}g פחמ׳ · {item.fat}g שומן</div>
                    </div>
                    <div style={{ fontSize:15, fontWeight:900, color:"#dc2626" }}>{item.calories}</div>
                    <button onClick={() => deleteItem(type,idx)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:15, color:"#c4bdb4", padding:"2px 4px" }}>✕</button>
                  </div>
                ))
              }
            </div>
          );
        })}

        <div style={{ fontSize:11, color:"#c4bdb4", textAlign:"center", marginTop:20, lineHeight:1.6 }}>
          הערכים הם הערכה בלבד ואינם מחליפים ייעוץ תזונתי מקצועי
        </div>
      </div>

      {/* MODAL */}
      {modal && (
        <div style={S.overlay} onClick={e => e.target===e.currentTarget && setModal(null)}>
          <div style={S.modal}>
            <div style={{ width:36, height:4, background:"#d4ccbf", borderRadius:2, margin:"12px auto 0" }} />
            <div style={S.modalHead}>
              <span style={{ fontSize:16, fontWeight:700 }}>הוסף ל{MEAL_CONFIG[modal.mealType].label}</span>
              <button style={S.closeBtn} onClick={() => setModal(null)}>✕</button>
            </div>
            <div style={{ padding:"18px 20px" }}>

              {!imgSrc ? (
                <>
                  <div style={S.uploadZone} onClick={() => fileRef.current.click()}>
                    <div style={{ fontSize:36, marginBottom:8 }}>📷</div>
                    <div style={{ fontSize:14, color:"#9a9188" }}>לחץ לבחור תמונה מהגלריה</div>
                    <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={e => handleFile(e.target.files[0])} />
                  </div>
                  <button style={S.camBtn} onClick={() => camRef.current.click()}>
                    📸 צלם עכשיו
                    <input ref={camRef} type="file" accept="image/*" capture="environment" style={{ display:"none" }} onChange={e => handleFile(e.target.files[0])} />
                  </button>
                </>
              ) : (
                <div style={{ position:"relative", marginBottom:14 }}>
                  <img src={imgSrc} alt="" style={{ width:"100%", maxHeight:220, objectFit:"cover", borderRadius:14, display:"block" }} />
                  <button onClick={() => { setImgSrc(null); setImgB64(null); setPending(null); setError(null); }}
                    style={{ position:"absolute", top:8, right:8, background:"rgba(0,0,0,0.6)", color:"#fff", border:"none", borderRadius:20, padding:"4px 10px", fontSize:12, cursor:"pointer" }}>✕ הסר</button>
                </div>
              )}

              {error && <div style={S.errorBox}>⚠️ {error}</div>}

              {imgSrc && !loading && !pending && (
                <button style={S.analyzeBtn} onClick={analyze}>🔍 נתח את האוכל</button>
              )}

              {loading && (
                <div style={{ textAlign:"center", padding:"24px 0" }}>
                  <div style={{ width:36, height:36, border:"3px solid #e8e2d9", borderTopColor:"#2d5a27", borderRadius:"50%", animation:"spin 0.7s linear infinite", margin:"0 auto 12px" }} />
                  <div style={{ fontSize:13, color:"#9a9188" }}>מנתח עם AI...</div>
                  <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                </div>
              )}

              {pending && (
                <>
                  <div style={S.resultBox}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
                      <span style={{ fontSize:28 }}>{pending.emoji}</span>
                      <div>
                        <div style={{ fontSize:15, fontWeight:700 }}>{pending.dish}</div>
                        <div style={{ fontSize:12, color:"#9a9188" }}>{pending.portion}</div>
                      </div>
                    </div>
                    <div style={S.macroGrid}>
                      {[
                        { v:pending.calories, l:"קלוריות",   c:"#dc2626" },
                        { v:pending.protein,  l:"חלבון g",    c:"#2563eb" },
                        { v:pending.carbs,    l:"פחמימות g",  c:"#d97706" },
                        { v:pending.fat,      l:"שומן g",     c:"#7c3aed" },
                      ].map((m,i) => (
                        <div key={i} style={S.macroCard}>
                          <div style={{ fontSize:18, fontWeight:900, color:m.c }}>{m.v}</div>
                          <div style={{ fontSize:10, color:"#9a9188", marginTop:2 }}>{m.l}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button style={S.confirmBtn} onClick={confirmAdd}>✓ הוסף ליומן</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
