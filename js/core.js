// ═══════════════════════════════════════════════
//  EVA Companion - Look4PVP (Salle) Module
// ═══════════════════════════════════════════════

var P = EVA.P, F = EVA.F;
var useState = React.useState, useEffect = React.useEffect, useRef = React.useRef, useCallback = React.useCallback;

var STORAGE_LOCATION = "eva-companion-location";
var AFTERH_COVER = "https://cdn.eva.gg/products/after_h-battle_arena/cover_2.webp";

function loadSavedLocation() {
  try { return JSON.parse(localStorage.getItem(STORAGE_LOCATION)); } catch(e) { return null; }
}
function saveLocationStorage(loc) {
  localStorage.setItem(STORAGE_LOCATION, JSON.stringify({ id: loc.id, identifier: loc.identifier, name: loc.name, department: loc.department }));
}

function fmtPhone(tel) {
  if (!tel) return "";
  var clean = tel.replace(/\s+/g, "").replace(/^\+33/, "0");
  if (clean.length === 10) return clean.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4 $5");
  return tel;
}

function getDateStr(offset) {
  var d = new Date(); d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function getDayLabel(offset) {
  if (offset === 0) return "Aujourd'hui";
  if (offset === 1) return "Demain";
  var d = new Date(); d.setDate(d.getDate() + offset);
  var days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  return days[d.getDay()] + " " + d.getDate();
}

EVA.Look4PVPView = function() {
  var _sl = useState([]), locations = _sl[0], setLocations = _sl[1];
  var _ss = useState(loadSavedLocation()), selected = _ss[0], setSelected = _ss[1];
  var _sd = useState(null), detail = _sd[0], setDetail = _sd[1];
  var _sf = useState(""), filter = _sf[0], setFilter = _sf[1];
  var _so = useState(false), dropdownOpen = _so[0], setDropdownOpen = _so[1];
  var _slo = useState(false), loadingLocs = _slo[0], setLoadingLocs = _slo[1];
  var _ses = useState([]), sessions = _ses[0], setSessions = _ses[1];
  var _sls = useState(false), loadingSessions = _sls[0], setLoadingSessions = _sls[1];
  var _day = useState(0), dayOffset = _day[0], setDayOffset = _day[1];
  var _lvl = useState("all"), levelFilter = _lvl[0], setLevelFilter = _lvl[1];
  var _jn = useState(false), joinableOnly = _jn[0], setJoinableOnly = _jn[1];
  var dropdownRef = useRef(null);

  // Load locations on mount
  useEffect(function() {
    setLoadingLocs(true);
    EVA.fetchLocations().then(function(list) { setLocations(list); })
    .catch(function(e) { console.error("Failed to load locations", e); })
    .finally(function() { setLoadingLocs(false); });
  }, []);

  // Load location detail when selection changes
  useEffect(function() {
    if (!selected || !selected.id) { setDetail(null); return; }
    EVA.fetchLocationDetail(selected.id).then(function(d) { setDetail(d); })
    .catch(function() {});
  }, [selected ? selected.id : null]);

  // Load sessions when location or day changes
  useEffect(function() {
    if (!selected || !selected.id) { setSessions([]); return; }
    var cancelled = false;
    setLoadingSessions(true);
    EVA.fetchSessions(selected.id, getDateStr(dayOffset)).then(function(list) {
      if (!cancelled) setSessions(list || []);
    }).catch(function() {
      if (!cancelled) setSessions([]);
    }).finally(function() {
      if (!cancelled) setLoadingSessions(false);
    });
    return function() { cancelled = true; };
  }, [selected ? selected.id : null, dayOffset]);

  // Close dropdown on outside click
  useEffect(function() {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("touchstart", handleClick);
    return function() { document.removeEventListener("mousedown", handleClick); document.removeEventListener("touchstart", handleClick); };
  }, []);

  var selectLocation = function(loc) {
    setSelected(loc); saveLocationStorage(loc); setDropdownOpen(false); setFilter("");
  };

  var filtered = locations;
  if (filter.trim()) {
    var q = filter.trim().toLowerCase();
    filtered = locations.filter(function(l) {
      return l.name.toLowerCase().indexOf(q) !== -1 || l.department.toLowerCase().indexOf(q) !== -1 || l.identifier.toLowerCase().indexOf(q) !== -1;
    });
  }

  // Filter sessions
  var filteredSessions = sessions.filter(function(s) {
    if (s.game.identifier !== "AFTER_H_BATTLE_ARENA") return false;
    if (levelFilter === "Beginner" && s.matchmakingLevel && s.matchmakingLevel !== "Beginner") return false;
    if (levelFilter === "Expert" && s.matchmakingLevel && s.matchmakingLevel !== "Expert") return false;
    if (joinableOnly) {
      if (s.takenSeatCount < 1 || s.availableSeatCount < 1) return false;
    }
    return true;
  });

  var btnStyle = function(active) {
    return {
      padding:"6px 12px", borderRadius:6, fontSize:11, fontFamily:F.mono, fontWeight:700,
      border:"1px solid "+(active ? P.accent+"55" : P.border),
      background: active ? P.accentDim : "transparent",
      color: active ? P.accent : P.textSec,
      cursor:"pointer", transition:"all 0.15s"
    };
  };

  return React.createElement("div", { className:"fade-in", style: { paddingBottom:20 } },

    // ── Location selector ──
    React.createElement("div", { ref: dropdownRef, style: { position:"relative", marginBottom:12 } },
      React.createElement("div", {
        onClick: function() { setDropdownOpen(!dropdownOpen); },
        style: {
          padding:"12px 14px", background:P.surface, borderRadius:10,
          border:"1px solid "+(dropdownOpen ? P.accent+"55" : P.border),
          display:"flex", alignItems:"center", gap:10, cursor:"pointer", transition:"all 0.2s"
        }
      },
        React.createElement("div", { style: { flex:1 } },
          selected
            ? React.createElement("div", { style: { display:"flex", alignItems:"center", gap:8 } },
                React.createElement("span", { style: { fontSize:11, padding:"2px 6px", borderRadius:4, background:P.accentDim, color:P.accent, fontFamily:F.mono, fontWeight:700 } }, selected.department),
                React.createElement("span", { style: { fontSize:14, fontWeight:600, color:P.text, fontFamily:F.main } }, selected.name)
              )
            : React.createElement("span", { style: { fontSize:14, color:P.textDim, fontFamily:F.main } }, "Choisir une salle...")
        ),
        React.createElement("span", { style: { fontSize:12, color:P.textDim, transform: dropdownOpen?"rotate(180deg)":"rotate(0)", transition:"transform 0.2s" } }, "\u25BC")
      ),
      dropdownOpen && React.createElement("div", { style: {
        position:"absolute", top:"100%", left:0, right:0, zIndex:200,
        background:P.surface, border:"1px solid "+P.border, borderRadius:10,
        marginTop:4, maxHeight:300, overflow:"hidden", display:"flex", flexDirection:"column",
        boxShadow:"0 8px 32px rgba(0,0,0,0.5)"
      }},
        React.createElement("div", { style: { padding:"8px 10px", borderBottom:"1px solid "+P.border } },
          React.createElement("input", {
            value: filter, onChange: function(e) { setFilter(e.target.value); },
            placeholder: "Rechercher...", autoFocus: true,
            style: { width:"100%", padding:"8px 10px", background:P.surfaceLight, border:"1px solid "+P.border, borderRadius:6, color:P.text, fontFamily:F.mono, fontSize:13 }
          })
        ),
        React.createElement("div", { style: { overflowY:"auto", maxHeight:240 } },
          loadingLocs && React.createElement(EVA.Spinner),
          !loadingLocs && filtered.length === 0 && React.createElement("div", { style: { padding:20, textAlign:"center", color:P.textDim, fontFamily:F.mono, fontSize:12 } }, "Aucune salle"),
          !loadingLocs && filtered.map(function(loc) {
            var isSel = selected && selected.id === loc.id;
            return React.createElement("div", {
              key: loc.id, onClick: function() { selectLocation(loc); },
              style: { padding:"10px 14px", display:"flex", alignItems:"center", gap:10, cursor:"pointer", borderBottom:"1px solid "+P.border, background: isSel ? P.accentDim : "transparent", transition:"background 0.15s" },
              onMouseEnter: function(e) { if(!isSel) e.currentTarget.style.background=P.surfaceHover; },
              onMouseLeave: function(e) { if(!isSel) e.currentTarget.style.background="transparent"; }
            },
              React.createElement("span", { style: { fontSize:11, padding:"2px 6px", borderRadius:4, minWidth:32, textAlign:"center", background: isSel?P.accent+"33":P.surfaceLight, color: isSel?P.accent:P.textSec, fontFamily:F.mono, fontWeight:700 } }, loc.department),
              React.createElement("span", { style: { fontSize:13, fontWeight:isSel?700:400, color:isSel?P.accent:P.text, fontFamily:F.main } }, loc.name)
            );
          })
        )
      )
    ),

    // ── Location info bar ──
    selected && detail && React.createElement("div", { style: { display:"flex", gap:6, marginBottom:12, flexWrap:"wrap" } },
      // Phone
      React.createElement("a", {
        href:"tel:"+selected.telephone.replace(/\s/g,""),
        style: { padding:"8px 12px", background:P.surface, borderRadius:8, border:"1px solid "+P.border, color:P.accent, fontFamily:F.mono, fontSize:12, textDecoration:"none", fontWeight:600 }
      }, fmtPhone(selected.telephone)),
      // Email
      React.createElement("a", {
        href:"mailto:"+selected.emailContact,
        style: { padding:"8px 12px", background:P.surface, borderRadius:8, border:"1px solid "+P.border, color:P.accent, fontFamily:F.mono, fontSize:11, textDecoration:"none", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:200 }
      }, selected.emailContact),
      // Maps
      detail.addressMapsUrl && React.createElement("a", {
        href: detail.addressMapsUrl, target:"_blank", rel:"noopener noreferrer",
        style: { padding:"8px 12px", background:P.surface, borderRadius:8, border:"1px solid "+P.border, color:P.text, fontFamily:F.mono, fontSize:11, textDecoration:"none" }
      }, detail.fullAddress || "Voir sur Maps"),
      // Book
      React.createElement("a", {
        href:"https://www.eva.gg/fr-FR/locations/"+selected.identifier, target:"_blank", rel:"noopener noreferrer",
        style: { padding:"8px 12px", background:P.accentDim, borderRadius:8, border:"1px solid "+P.accent+"33", color:P.accent, fontFamily:F.mono, fontSize:12, textDecoration:"none", fontWeight:700 }
      }, "R\u00E9server")
    ),

    // ── Filters ──
    selected && React.createElement("div", { style: { marginBottom:12 } },
      // Day selector
      React.createElement("div", { style: { display:"flex", gap:4, marginBottom:8, flexWrap:"wrap" } },
        [0,1,2,3,4,5,6].map(function(d) {
          return React.createElement("button", {
            key:d, onClick: function() { setDayOffset(d); },
            style: btnStyle(dayOffset === d)
          }, getDayLabel(d));
        })
      ),
      // Level + joinable
      React.createElement("div", { style: { display:"flex", gap:4, alignItems:"center", flexWrap:"wrap" } },
        ["all","Beginner","Expert"].map(function(lv) {
          return React.createElement("button", {
            key:lv, onClick: function() { setLevelFilter(lv); },
            style: btnStyle(levelFilter === lv)
          }, lv === "all" ? "All" : lv);
        }),
        React.createElement("button", {
          onClick: function() { setJoinableOnly(!joinableOnly); },
          style: Object.assign({}, btnStyle(joinableOnly), { marginLeft:4 })
        }, "Joinable")
      )
    ),

    // ── Sessions list ──
    selected && loadingSessions && React.createElement(EVA.Spinner),

    selected && !loadingSessions && filteredSessions.length === 0 && React.createElement(EVA.Empty, { text:"Aucune session" }),

    selected && !loadingSessions && filteredSessions.length > 0 && React.createElement("div", null,
      filteredSessions.map(function(s, i) {
        var time = s.slot.startTime.slice(0, 5);
        var hasPeople = s.takenSeatCount > 0;
        var priceDot = s.pricingType === "OFF_PEAK_HOUR" ? "\uD83D\uDD35" : "\uD83D\uDFE0";
        var seatColor = s.availableSeatCount > 0 ? P.win : P.lose;

        return React.createElement("div", {
          key: s.slot.id + "-" + i,
          style: {
            background:P.surface, borderRadius:10, padding:"10px 12px", marginBottom:4,
            border:"1px solid "+P.border, display:"flex", alignItems:"center", gap:10
          }
        },
          // Cover image
          React.createElement("img", { src: AFTERH_COVER, style: { width:40, height:40, borderRadius:6, objectFit:"cover", flexShrink:0 } }),

          // Time
          React.createElement("div", { style: { minWidth:42, fontSize:15, fontWeight:700, color:P.accent, fontFamily:F.mono } }, time),

          // Name + level + pricing dot
          React.createElement("div", { style: { flex:1, minWidth:0 } },
            React.createElement("div", { style: { fontSize:13, fontWeight:600, color:P.text, fontFamily:F.main, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" } }, s.game.name),
            React.createElement("div", { style: { fontSize:11, color:P.textSec, fontFamily:F.mono, display:"flex", alignItems:"center", gap:4 } },
              hasPeople && s.matchmakingLevel && React.createElement("span", null, s.matchmakingLevel),
              React.createElement("span", null, priceDot)
            )
          ),

          // Seats
          React.createElement("div", { style: { textAlign:"right", flexShrink:0 } },
            React.createElement("span", { style: { fontSize:15, fontWeight:700, color:seatColor, fontFamily:F.mono } }, s.takenSeatCount),
            React.createElement("span", { style: { fontSize:12, color:P.textDim, fontFamily:F.mono } }, "/"+s.totalSeatCount)
          )
        );
      })
    ),

    // No selection
    !selected && !loadingLocs && React.createElement(EVA.Empty, { text:"S\u00E9lectionnez une salle" })
  );
};