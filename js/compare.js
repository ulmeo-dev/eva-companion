// ═══════════════════════════════════════════════
//  EVA Companion - Compare Module
// ═══════════════════════════════════════════════

var P = EVA.P, F = EVA.F;
var n = EVA.n, nf = EVA.nf, wr = EVA.wr, fmtDist = EVA.fmtDist;

EVA.CompareView = function(props) {
  var a = props.a, b = props.b;
  if (!a || !b) return React.createElement(EVA.Empty, { text:"Sélectionnez deux profils" });
  var sA = a.statistics ? a.statistics.data : null;
  var sB = b.statistics ? b.statistics.data : null;
  if (!sA && !sB) return React.createElement(EVA.Empty, { text:"Aucune donnée pour cette saison pour les deux joueurs" });
  if (!sA) return React.createElement(EVA.Empty, { text: (a.user ? a.user.displayName : "Joueur 1") + " n'a pas de données sur cette saison" });
  if (!sB) return React.createElement(EVA.Empty, { text: (b.user ? b.user.displayName : "Joueur 2") + " n'a pas de données sur cette saison" });

  var generalRows = [
    { l:"Niveau", a:a.experience ? a.experience.level : 0, b:b.experience ? b.experience.level : 0 },
    { l:"Parties", a:n(sA.gameCount), b:n(sB.gameCount) },
    { l:"Win Rate", a:wr(n(sA.gameVictoryCount),n(sA.gameCount))+"%", b:wr(n(sB.gameVictoryCount),n(sB.gameCount))+"%", nA:+wr(n(sA.gameVictoryCount),n(sA.gameCount)), nB:+wr(n(sB.gameVictoryCount),n(sB.gameCount)) },
    { l:"K/D", a:nf(sA.killsByDeaths,2), b:nf(sB.killsByDeaths,2), nA:n(sA.killsByDeaths), nB:n(sB.killsByDeaths) },
    { l:"Kills", a:n(sA.kills), b:n(sB.kills) },
    { l:"Deaths", a:n(sA.deaths), b:n(sB.deaths), inv:true },
    { l:"Assists", a:n(sA.assists), b:n(sB.assists) },
    { l:"Best Streak", a:n(sA.bestKillStreak), b:n(sB.bestKillStreak) },
    { l:"Best Dégâts", a:n(sA.bestInflictedDamage), b:n(sB.bestInflictedDamage) },
    { l:"Dégâts totaux", a:Math.round(n(sA.inflictedDamage)/1000)+"k", b:Math.round(n(sB.inflictedDamage)/1000)+"k", nA:n(sA.inflictedDamage), nB:n(sB.inflictedDamage) },
  ];

  var gcA = n(sA.gameCount) || 1, gcB = n(sB.gameCount) || 1;
  var avgRows = [
    { l:"Kills / partie", a:(n(sA.kills)/gcA).toFixed(1), b:(n(sB.kills)/gcB).toFixed(1), nA:n(sA.kills)/gcA, nB:n(sB.kills)/gcB },
    { l:"Deaths / partie", a:(n(sA.deaths)/gcA).toFixed(1), b:(n(sB.deaths)/gcB).toFixed(1), nA:n(sA.deaths)/gcA, nB:n(sB.deaths)/gcB, inv:true },
    { l:"Assists / partie", a:(n(sA.assists)/gcA).toFixed(1), b:(n(sB.assists)/gcB).toFixed(1), nA:n(sA.assists)/gcA, nB:n(sB.assists)/gcB },
    { l:"Dégâts / partie", a:Math.round(n(sA.inflictedDamage)/gcA), b:Math.round(n(sB.inflictedDamage)/gcB) },
    { l:"Distance / partie", a:fmtDist(n(sA.traveledDistanceAverage)), b:fmtDist(n(sB.traveledDistanceAverage)), nA:n(sA.traveledDistanceAverage), nB:n(sB.traveledDistanceAverage) },
  ];

  function renderRows(rows, startIdx) {
    return rows.map(function(r,i) {
      var idx = startIdx + i;
      var numA = r.nA != null ? r.nA : (typeof r.a==="number"?r.a:0);
      var numB = r.nB != null ? r.nB : (typeof r.b==="number"?r.b:0);
      var aW = r.inv ? numA<numB : numA>numB;
      var bW = r.inv ? numB<numA : numB>numA;
      return React.createElement("div", { key:idx, style: {
        display:"grid", gridTemplateColumns:"1fr auto 1fr",
        padding:"8px 14px", borderBottom:"1px solid "+P.border,
        background: idx%2===0 ? P.surface : "transparent"
      }},
        React.createElement("div", { style: { fontSize:16, fontWeight:700, fontFamily:F.mono, textAlign:"center", color:aW?P.win:P.text } }, r.a),
        React.createElement("div", { style: { fontSize:11, color:P.textSec, fontFamily:F.mono, textTransform:"uppercase", letterSpacing:1, padding:"0 12px", display:"flex", alignItems:"center" } }, r.l),
        React.createElement("div", { style: { fontSize:16, fontWeight:700, fontFamily:F.mono, textAlign:"center", color:bW?P.win:P.text } }, r.b)
      );
    });
  }

  function sectionHeader(title) {
    return React.createElement("div", { style: {
      padding:"10px 14px 6px", fontSize:11, fontWeight:700, color:P.accent,
      fontFamily:F.mono, textTransform:"uppercase", letterSpacing:2,
      borderBottom:"1px solid "+P.border, background:P.surface
    }}, title);
  }

  return React.createElement("div", { className:"fade-in", style: { paddingBottom:20 } },
    React.createElement("div", { style: {
      display:"grid", gridTemplateColumns:"1fr auto 1fr", gap:0, marginBottom:16,
      background:P.surface, borderRadius:12, overflow:"hidden", border:"1px solid "+P.border
    }},
      React.createElement("div", { style: { padding:16, textAlign:"center" } },
        React.createElement("div", { style: { fontSize:18, fontWeight:700, color:P.accent, fontFamily:F.main } }, a.user.displayName),
        React.createElement("div", { style: { fontSize:11, color:P.textDim, fontFamily:F.mono } }, "LVL "+(a.experience?a.experience.level:"?"))
      ),
      React.createElement("div", { style: { padding:16, display:"flex", alignItems:"center", color:P.textDim, fontWeight:800, fontFamily:F.main, fontSize:18 } }, "VS"),
      React.createElement("div", { style: { padding:16, textAlign:"center" } },
        React.createElement("div", { style: { fontSize:18, fontWeight:700, color:P.lose, fontFamily:F.main } }, b.user.displayName),
        React.createElement("div", { style: { fontSize:11, color:P.textDim, fontFamily:F.mono } }, "LVL "+(b.experience?b.experience.level:"?"))
      )
    ),
    sectionHeader("Générales"),
    renderRows(generalRows, 0),
    sectionHeader("Moyennes par partie"),
    renderRows(avgRows, 100)
  );
};
