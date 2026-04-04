// ═══════════════════════════════════════════════
//  EVA Companion - Look4PVP (Salle) Module
// ═══════════════════════════════════════════════

var P = EVA.P, F = EVA.F;

EVA.Look4PVPView = function() {
  var items = [
    { icon:"\uD83D\uDCCD", label:"Adresse", value:"Rue François Cevert\nZAC Pariwest, 78310 Maurepas" },
    { icon:"\uD83D\uDD50", label:"Horaires", value:"Semaine : 13h30 \u2013 22h\nWeek-end : 9h30 \u2013 22h" },
    { icon:"\uD83C\uDFAE", label:"Jeux", value:"After-H Battle Arena (PvP)\nMoon of the Dead (PvE)\nEVA Darts" },
    { icon:"\uD83D\uDCB0", label:"Tarifs", value:"Session 40min : ~20\u20AC (heure creuse)\nAbonnements disponibles" },
    { icon:"\uD83D\uDC65", label:"Capacité", value:"Jusqu'\u00E0 10 joueurs par ar\u00E8ne\n2 ar\u00E8nes disponibles" },
  ];
  return React.createElement("div", { className:"fade-in", style: { paddingBottom:20 } },
    React.createElement("div", { style: {
      background:"linear-gradient(135deg, "+P.surface+" 0%, #0d1520 100%)",
      borderRadius:12, padding:20, marginBottom:16, border:"1px solid "+P.border, position:"relative", overflow:"hidden"
    }},
      React.createElement("div", { style: { position:"absolute", top:-20, right:-20, width:100, height:100, borderRadius:"50%", background:"#ff572233", filter:"blur(40px)" } }),
      React.createElement("div", { style: { fontSize:22, fontWeight:800, color:P.text, fontFamily:F.main, marginBottom:4, position:"relative" } }, "EVA Maurepas"),
      React.createElement("div", { style: { fontSize:12, color:P.textSec, fontFamily:F.mono, position:"relative" } }, "Ar\u00E8ne VR \u2022 Yvelines (78)")
    ),
    items.map(function(it,i) {
      return React.createElement("div", { key:i, style: {
        background:P.surface, borderRadius:10, padding:"12px 14px", marginBottom:6, border:"1px solid "+P.border, display:"flex", gap:12
      }},
        React.createElement("span", { style: { fontSize:20 } }, it.icon),
        React.createElement("div", null,
          React.createElement("div", { style: { fontSize:12, color:P.textSec, fontFamily:F.mono, textTransform:"uppercase", letterSpacing:1, marginBottom:2 } }, it.label),
          React.createElement("div", { style: { fontSize:14, color:P.text, fontFamily:F.main, whiteSpace:"pre-line" } }, it.value)
        )
      );
    }),
    React.createElement("a", {
      href:"https://www.eva.gg/fr-FR/locations/maurepas-78", target:"_blank", rel:"noopener noreferrer",
      style: {
        display:"block", textAlign:"center", padding:"14px", marginTop:12,
        background:"linear-gradient(135deg, "+P.accent+", #0088a0)",
        color:P.bg, borderRadius:10, fontWeight:800, fontSize:15,
        fontFamily:F.main, textDecoration:"none", letterSpacing:1,
        textTransform:"uppercase", boxShadow:"0 4px 20px "+P.accentGlow
      }
    }, "R\u00E9server une session")
  );
};
