// ═══════════════════════════════════════════════
//  EVA Companion - Look4PVP (Salle) Module
// ═══════════════════════════════════════════════

var P = EVA.P, F = EVA.F;
var useState = React.useState, useEffect = React.useEffect, useRef = React.useRef;

var STORAGE_LOCATION = "eva-companion-location";

function loadSavedLocation() {
  try { return JSON.parse(localStorage.getItem(STORAGE_LOCATION)); }
  catch(e) { return null; }
}
function saveLocation(loc) {
  localStorage.setItem(STORAGE_LOCATION, JSON.stringify(loc));
}

EVA.Look4PVPView = function() {
  var _sl = useState([]), locations = _sl[0], setLocations = _sl[1];
  var _ss = useState(loadSavedLocation()), selected = _ss[0], setSelected = _ss[1];
  var _sf = useState(""), filter = _sf[0], setFilter = _sf[1];
  var _so = useState(false), dropdownOpen = _so[0], setDropdownOpen = _so[1];
  var _slo = useState(false), loadingLocs = _slo[0], setLoadingLocs = _slo[1];
  var dropdownRef = useRef(null);

  // Load locations on mount
  useEffect(function() {
    setLoadingLocs(true);
    EVA.fetchLocations().then(function(list) {
      setLocations(list);
      if (selected && selected.id) {
        var fresh = list.find(function(l) { return l.id === selected.id; });
        if (fresh) { setSelected(fresh); saveLocation(fresh); }
      }
    }).catch(function(e) { console.error("Failed to load locations", e); })
    .finally(function() { setLoadingLocs(false); });
  }, []);

  // Close dropdown on outside click
  useEffect(function() {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("touchstart", handleClick);
    return function() {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleClick);
    };
  }, []);

  var selectLocation = function(loc) {
    setSelected(loc);
    saveLocation(loc);
    setDropdownOpen(false);
    setFilter("");
  };

  // Filter locations
  var filtered = locations;
  if (filter.trim()) {
    var q = filter.trim().toLowerCase();
    filtered = locations.filter(function(l) {
      return l.name.toLowerCase().indexOf(q) !== -1 ||
             l.department.toLowerCase().indexOf(q) !== -1 ||
             l.identifier.toLowerCase().indexOf(q) !== -1;
    });
  }

  // Format phone number for display
  function fmtPhone(tel) {
    if (!tel) return "";
    var clean = tel.replace(/\s+/g, "").replace(/^\+33/, "0");
    if (clean.length === 10) {
      return clean.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4 $5");
    }
    return tel;
  }

  return React.createElement("div", { className:"fade-in", style: { paddingBottom:20 } },

    // Header
    React.createElement("div", { style: {
      background:"linear-gradient(135deg, "+P.surface+" 0%, #0d1520 100%)",
      borderRadius:12, padding:20, marginBottom:16, border:"1px solid "+P.border, position:"relative", overflow:"hidden"
    }},
      React.createElement("div", { style: { position:"absolute", top:-20, right:-20, width:100, height:100, borderRadius:"50%", background:"#ff572233", filter:"blur(40px)" } }),
      React.createElement("div", { style: { fontSize:22, fontWeight:800, color:P.text, fontFamily:F.main, marginBottom:4, position:"relative" } },
        selected ? "EVA " + selected.name : "Trouver une salle"
      ),
      React.createElement("div", { style: { fontSize:12, color:P.textSec, fontFamily:F.mono, position:"relative" } },
        selected ? "Ar\u00E8ne VR \u2022 D\u00E9pt. " + selected.department : "S\u00E9lectionnez votre salle EVA"
      )
    ),

    // Location selector
    React.createElement("div", { ref: dropdownRef, style: { position:"relative", marginBottom:16 } },
      React.createElement("div", {
        onClick: function() { setDropdownOpen(!dropdownOpen); },
        style: {
          padding:"12px 14px", background:P.surface, borderRadius:10,
          border:"1px solid "+(dropdownOpen ? P.accent+"55" : P.border),
          display:"flex", alignItems:"center", gap:10, cursor:"pointer",
          transition:"all 0.2s"
        }
      },
        React.createElement("span", { style: { fontSize:18 } }, "\uD83D\uDCCD"),
        React.createElement("div", { style: { flex:1 } },
          selected
            ? React.createElement("div", { style: { display:"flex", alignItems:"center", gap:8 } },
                React.createElement("span", { style: { fontSize:11, padding:"2px 6px", borderRadius:4, background:P.accentDim, color:P.accent, fontFamily:F.mono, fontWeight:700 } }, selected.department),
                React.createElement("span", { style: { fontSize:14, fontWeight:600, color:P.text, fontFamily:F.main } }, selected.name)
              )
            : React.createElement("span", { style: { fontSize:14, color:P.textDim, fontFamily:F.main } }, "Choisir une salle...")
        ),
        React.createElement("span", { style: { fontSize:12, color:P.textDim, transform: dropdownOpen ? "rotate(180deg)" : "rotate(0)", transition:"transform 0.2s" } }, "\u25BC")
      ),

      // Dropdown
      dropdownOpen && React.createElement("div", { style: {
        position:"absolute", top:"100%", left:0, right:0, zIndex:200,
        background:P.surface, border:"1px solid "+P.border, borderRadius:10,
        marginTop:4, maxHeight:300, overflow:"hidden", display:"flex", flexDirection:"column",
        boxShadow:"0 8px 32px rgba(0,0,0,0.5)"
      }},
        // Search input
        React.createElement("div", { style: { padding:"8px 10px", borderBottom:"1px solid "+P.border } },
          React.createElement("input", {
            value: filter,
            onChange: function(e) { setFilter(e.target.value); },
            placeholder: "Rechercher une salle...",
            autoFocus: true,
            style: {
              width:"100%", padding:"8px 10px", background:P.surfaceLight,
              border:"1px solid "+P.border, borderRadius:6, color:P.text,
              fontFamily:F.mono, fontSize:13
            }
          })
        ),
        // List
        React.createElement("div", { style: { overflowY:"auto", maxHeight:240 } },
          loadingLocs && React.createElement(EVA.Spinner),
          !loadingLocs && filtered.length === 0 && React.createElement("div", { style: { padding:20, textAlign:"center", color:P.textDim, fontFamily:F.mono, fontSize:12 } }, "Aucune salle trouv\u00E9e"),
          !loadingLocs && filtered.map(function(loc) {
            var isSel = selected && selected.id === loc.id;
            return React.createElement("div", {
              key: loc.id,
              onClick: function() { selectLocation(loc); },
              style: {
                padding:"10px 14px", display:"flex", alignItems:"center", gap:10,
                cursor:"pointer", borderBottom:"1px solid "+P.border,
                background: isSel ? P.accentDim : "transparent",
                transition:"background 0.15s"
              },
              onMouseEnter: function(e) { if(!isSel) e.currentTarget.style.background = P.surfaceHover; },
              onMouseLeave: function(e) { if(!isSel) e.currentTarget.style.background = "transparent"; }
            },
              React.createElement("span", { style: {
                fontSize:11, padding:"2px 6px", borderRadius:4, minWidth:32, textAlign:"center",
                background: isSel ? P.accent+"33" : P.surfaceLight,
                color: isSel ? P.accent : P.textSec,
                fontFamily:F.mono, fontWeight:700
              }}, loc.department),
              React.createElement("span", { style: {
                fontSize:13, fontWeight: isSel ? 700 : 400,
                color: isSel ? P.accent : P.text,
                fontFamily:F.main
              }}, loc.name)
            );
          })
        )
      )
    ),

    // Selected location info
    selected && React.createElement("div", null,
      // Phone
      React.createElement("div", { style: {
        background:P.surface, borderRadius:10, padding:"12px 14px", marginBottom:6,
        border:"1px solid "+P.border, display:"flex", gap:12, alignItems:"center"
      }},
        React.createElement("span", { style: { fontSize:20 } }, "\uD83D\uDCDE"),
        React.createElement("div", { style: { flex:1 } },
          React.createElement("div", { style: { fontSize:12, color:P.textSec, fontFamily:F.mono, textTransform:"uppercase", letterSpacing:1, marginBottom:2 } }, "T\u00E9l\u00E9phone"),
          React.createElement("a", {
            href:"tel:"+selected.telephone.replace(/\s/g,""),
            style: { fontSize:16, color:P.accent, fontFamily:F.mono, textDecoration:"none", fontWeight:600 }
          }, fmtPhone(selected.telephone))
        )
      ),

      // Email
      React.createElement("div", { style: {
        background:P.surface, borderRadius:10, padding:"12px 14px", marginBottom:6,
        border:"1px solid "+P.border, display:"flex", gap:12, alignItems:"center"
      }},
        React.createElement("span", { style: { fontSize:20 } }, "\u2709\uFE0F"),
        React.createElement("div", { style: { flex:1 } },
          React.createElement("div", { style: { fontSize:12, color:P.textSec, fontFamily:F.mono, textTransform:"uppercase", letterSpacing:1, marginBottom:2 } }, "Email"),
          React.createElement("a", {
            href:"mailto:"+selected.emailContact,
            style: { fontSize:13, color:P.accent, fontFamily:F.mono, textDecoration:"none" }
          }, selected.emailContact)
        )
      ),

      // Games
      React.createElement("div", { style: {
        background:P.surface, borderRadius:10, padding:"12px 14px", marginBottom:6,
        border:"1px solid "+P.border, display:"flex", gap:12
      }},
        React.createElement("span", { style: { fontSize:20 } }, "\uD83C\uDFAE"),
        React.createElement("div", null,
          React.createElement("div", { style: { fontSize:12, color:P.textSec, fontFamily:F.mono, textTransform:"uppercase", letterSpacing:1, marginBottom:2 } }, "Jeux"),
          React.createElement("div", { style: { fontSize:14, color:P.text, fontFamily:F.main, whiteSpace:"pre-line" } }, "After-H Battle Arena (PvP)\nMoon of the Dead (PvE)\nEVA Darts")
        )
      ),

      // Book button
      React.createElement("a", {
        href:"https://www.eva.gg/fr-FR/locations/"+selected.identifier,
        target:"_blank", rel:"noopener noreferrer",
        style: {
          display:"block", textAlign:"center", padding:"14px", marginTop:12,
          background:"linear-gradient(135deg, "+P.accent+", #0088a0)",
          color:P.bg, borderRadius:10, fontWeight:800, fontSize:15,
          fontFamily:F.main, textDecoration:"none", letterSpacing:1,
          textTransform:"uppercase", boxShadow:"0 4px 20px "+P.accentGlow
        }
      }, "R\u00E9server \u00E0 " + selected.name)
    ),

    // No selection message
    !selected && !loadingLocs && React.createElement(EVA.Empty, { text:"S\u00E9lectionnez une salle pour voir ses informations" })
  );
};