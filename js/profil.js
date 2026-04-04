// ═══════════════════════════════════════════════
//  EVA Companion - Profile Module
//  XPBar, StatCard, MatchCard, ProfileView
// ═══════════════════════════════════════════════

var P = EVA.P, F = EVA.F;
var useState = React.useState;

EVA.XPBar = function(props) {
  var exp = props.exp;
  if (!exp) return null;
  var pct = exp.levelProgressionPercentage;
  var currentXP = exp.experience - exp.experienceForCurrentLevel;
  var neededXP = exp.experienceForNextLevel - exp.experienceForCurrentLevel;
  return React.createElement("div", { style: { width:"100%", marginTop:8 } },
    React.createElement("div", { style: { display:"flex", justifyContent:"space-between", fontSize:11, color:P.textSec, marginBottom:3, fontFamily:F.mono } },
      React.createElement("span", null, "LVL "+exp.level),
      React.createElement("span", null, currentXP.toLocaleString("fr-FR") + " / " + neededXP.toLocaleString("fr-FR") + " XP"),
      React.createElement("span", null, "LVL "+(exp.level+1))
    ),
    React.createElement("div", { style: { width:"100%", height:6, background:P.surfaceLight, borderRadius:3, overflow:"hidden" } },
      React.createElement("div", { style: {
        width: pct+"%", height:"100%", borderRadius:3,
        background: "linear-gradient(90deg, "+P.accent+", #0088a0)",
        boxShadow: "0 0 10px "+P.accentGlow, transition:"width 1s ease"
      }})
    ),
    React.createElement("div", { style: { textAlign:"center", fontSize:10, color:P.textDim, marginTop:3, fontFamily:F.mono } },
      pct.toFixed(1) + "% — " + exp.experience.toLocaleString("fr-FR") + " XP total"
    )
  );
};

EVA.StatCard = function(props) {
  var label = props.label, value = props.value, sub = props.sub, color = props.color;
  return React.createElement("div", { style: {
    background:P.surfaceLight, borderRadius:8, padding:"10px 12px",
    flex:"1 1 45%", minWidth:0, borderLeft:"3px solid "+(color||P.accent)
  }},
    React.createElement("div", { style: { fontSize:11, color:P.textSec, textTransform:"uppercase", letterSpacing:1, fontFamily:F.mono } }, label),
    React.createElement("div", { style: { fontSize:22, fontWeight:700, color:color||P.text, fontFamily:F.main, marginTop:2 } }, value),
    sub && React.createElement("div", { style: { fontSize:11, color:P.textDim, marginTop:1 } }, sub)
  );
};

EVA.MatchCard = function(props) {
  var game = props.game, meId = props.meId;
  var _s = useState(false), open = _s[0], setOpen = _s[1];
  var me = game.players.find(function(p) { return p.userId === meId; });
  var isWin = me && me.data.outcome === "Victory";
  var isFFA = game.mode.identifier === "FreeForAll";
  var bc = isWin ? P.win : P.lose;
  var bg = isWin ? P.winDim : P.loseDim;

  var sorted = game.players.slice().sort(function(a,b) {
    if (a.data.outcome === "Victory" && b.data.outcome !== "Victory") return -1;
    if (b.data.outcome === "Victory" && a.data.outcome !== "Victory") return 1;
    return a.data.rank - b.data.rank;
  });

  var ranked1 = game.players.filter(function(p) { return p.data.rank === 1; });
  var mvpPlayer = ranked1.length > 0 ? ranked1.reduce(function(best, p) { return p.data.score > best.data.score ? p : best; }, ranked1[0]) : null;
  var mvpId = mvpPlayer ? mvpPlayer.userId : null;

  return React.createElement("div", {
    className: "fade-in",
    style: { background:P.surface, borderRadius:10, marginBottom:8, border:"1px solid "+bc+"33", overflow:"hidden" },
    onClick: function() { setOpen(!open); }
  },
    React.createElement("div", { style: { padding:"10px 14px", display:"flex", alignItems:"center", gap:10 } },
      React.createElement("div", { style: {
        width:40, minWidth:40, height:40, borderRadius:8, background:bg,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:11, fontWeight:800, color:bc, fontFamily:F.mono, letterSpacing:1
      }}, isWin ? "W" : "L"),
      React.createElement("div", { style: { flex:1, minWidth:0 } },
        React.createElement("div", { style: { display:"flex", justifyContent:"space-between", alignItems:"center" } },
          React.createElement("span", { style: { fontSize:14, fontWeight:700, color:P.text, fontFamily:F.main } }, game.map.name),
          React.createElement("span", { style: { fontSize:11, color:P.textDim, fontFamily:F.mono } }, EVA.fmtDT(game.createdAt))
        ),
        me && React.createElement("div", { style: { display:"flex", gap:12, marginTop:3, fontSize:12, alignItems:"center" } },
          me.userId === mvpId && React.createElement("span", { style: { fontSize:13 }, title:"MVP" }, "\uD83D\uDC51"),
          React.createElement("span", { style: { color:P.textSec } }, isFFA ? "FFA" : game.data.teamOne.score+" - "+game.data.teamTwo.score),
          React.createElement("span", { style: { color:P.accent, fontFamily:F.mono, fontWeight:600 } }, me.data.kills+"/"+me.data.deaths+"/"+me.data.assists),
          React.createElement("span", { style: { color:P.textDim } }, me.data.inflictedDamage+" dmg"),
          React.createElement("span", { style: { color:P.textDim } }, "#"+me.data.rank)
        )
      ),
      React.createElement("div", { style: { fontSize:14, color:P.textDim, transform: open?"rotate(180deg)":"rotate(0)", transition:"transform 0.2s" } }, "\u25BC")
    ),
    open && React.createElement("div", { style: { padding:"0 10px 10px", borderTop:"1px solid "+P.border } },
      React.createElement("div", { style: { display:"grid", gridTemplateColumns:"1fr 38px 32px 32px 32px 50px 42px", gap:2, padding:"8px 4px 4px", fontSize:10, color:P.textDim, fontFamily:F.mono, textTransform:"uppercase", letterSpacing:1 } },
        React.createElement("span",null,"Joueur"), React.createElement("span",null,"Pts"),
        React.createElement("span",null,"K"), React.createElement("span",null,"D"),
        React.createElement("span",null,"A"), React.createElement("span",null,"Dmg"), React.createElement("span",null,"Acc")
      ),
      sorted.map(function(p) {
        var isMe = p.userId === meId;
        var pW = p.data.outcome === "Victory";
        var isMvp = p.userId === mvpId;
        var teamColor = pW ? P.win : P.lose;
        var highlightBg = isMe ? (pW ? P.winDim : P.loseDim) : "transparent";
        return React.createElement("div", { key: p.id, style: {
          display:"grid", gridTemplateColumns:"1fr 38px 32px 32px 32px 50px 42px",
          gap:2, padding:"5px 4px", fontSize:12, fontFamily:F.mono,
          background: highlightBg, borderRadius:4,
          borderLeft: isMe ? "2px solid "+teamColor : "2px solid transparent",
          color: P.text
        }},
          React.createElement("span", { style: { overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", color: teamColor, fontWeight:isMe?700:400, display:"flex", alignItems:"center", gap:3 } },
            isMvp && React.createElement("span", { style: { fontSize:13, flexShrink:0 }, title:"MVP" }, "\uD83D\uDC51"),
            React.createElement("span", { style: { overflow:"hidden", textOverflow:"ellipsis" } }, p.data.niceName)
          ),
          React.createElement("span", { style: { color: P.gold } }, p.data.score),
          React.createElement("span",null,p.data.kills), React.createElement("span",null,p.data.deaths),
          React.createElement("span",null,p.data.assists), React.createElement("span",null,p.data.inflictedDamage),
          React.createElement("span",null,(p.data.firedAccuracy*100).toFixed(0)+"%")
        );
      }),
      React.createElement("div", { style: { display:"flex", gap:8, marginTop:6, fontSize:10, color:P.textDim, fontFamily:F.mono } },
        React.createElement("span",null,game.mode.identifier),
        React.createElement("span",null,"\u2022"),
        React.createElement("span",null,EVA.fmtTime(game.data.duration)),
        React.createElement("span",null,"\u2022"),
        React.createElement("span",null,game.terrain.location.name)
      )
    )
  );
};

EVA.ProfileView = function(props) {
  var data = props.data, history = props.history, loading = props.loading;
  var seasons = props.seasons, currentSeasonId = props.currentSeasonId;
  var n = EVA.n;

  if (loading) return React.createElement(EVA.Spinner);
  if (!data || !data.user) return React.createElement(EVA.Empty, { text: "Profil non trouvé ou privé" });

  var s = data.statistics ? data.statistics.data : null;
  var exp = data.experience;
  var u = data.user;
  var hasStats = s && s.gameCount > 0;
  var curSeason = seasons ? seasons.find(function(x) { return x.id === currentSeasonId; }) : null;

  return React.createElement("div", { className:"fade-in", style: { paddingBottom:20 } },
    // Header card
    React.createElement("div", { style: {
      background:"linear-gradient(135deg, "+P.surface+" 0%, #0d1520 100%)",
      borderRadius:12, padding:20, marginBottom:16, border:"1px solid "+P.border,
      position:"relative", overflow:"hidden"
    }},
      React.createElement("div", { style: { position:"absolute", top:-30, right:-30, width:120, height:120, borderRadius:"50%", background:P.accentDim, filter:"blur(40px)" } }),
      React.createElement("div", { style: { display:"flex", alignItems:"center", gap:14, position:"relative" } },
        React.createElement("div", { style: {
          width:56, height:56, borderRadius:"50%",
          background:"linear-gradient(135deg, "+P.accent+", #0088a0)",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:22, fontWeight:800, color:P.bg, fontFamily:F.main,
          boxShadow:"0 0 20px "+P.accentGlow
        }}, u.displayName.charAt(0)),
        React.createElement("div", { style: { flex:1 } },
          React.createElement("div", { style: { fontSize:22, fontWeight:700, color:P.text, fontFamily:F.main } }, u.displayName),
          React.createElement("div", { style: { fontSize:12, color:P.textSec, fontFamily:F.mono } }, u.username),
          React.createElement("div", { style: { display:"flex", alignItems:"center", gap:8, marginTop:4 } },
            data.seasonPass && data.seasonPass.active && React.createElement("span", { style: { fontSize:10, padding:"2px 8px", borderRadius:4, background:P.goldDim, color:P.gold, fontWeight:700, letterSpacing:1, fontFamily:F.mono } }, "SEASON PASS"),
            curSeason && React.createElement("span", { style: { fontSize:10, padding:"2px 8px", borderRadius:4, background:P.accentDim, color:P.accent, fontWeight:700, letterSpacing:1, fontFamily:F.mono } }, EVA.seasonShort(curSeason))
          )
        )
      ),
      React.createElement(EVA.XPBar, { exp: exp })
    ),

    // Stats
    hasStats && React.createElement("div", { style: { display:"flex", flexWrap:"wrap", gap:8, marginBottom:16 } },
      React.createElement(EVA.StatCard, { label:"Parties", value:n(s.gameCount), sub:EVA.fmtTime(n(s.gameTime))+" de jeu" }),
      React.createElement(EVA.StatCard, { label:"Win Rate", value:EVA.wr(n(s.gameVictoryCount),n(s.gameCount))+"%", color:P.win, sub:n(s.gameVictoryCount)+"V / "+n(s.gameDefeatCount)+"D" }),
      React.createElement(EVA.StatCard, { label:"K/D", value:s.killsByDeaths!=null?s.killsByDeaths.toFixed(2):"0", color:(n(s.killsByDeaths))>=1.5?P.win:(n(s.killsByDeaths))>=1?P.gold:P.lose, sub:n(s.kills)+"K / "+n(s.deaths)+"D / "+n(s.assists)+"A" }),
      React.createElement(EVA.StatCard, { label:"Précision", value:s.killDeathRatio!=null?((s.killDeathRatio*100).toFixed(1)+"%"):"0%" }),
      React.createElement(EVA.StatCard, { label:"Best Streak", value:n(s.bestKillStreak), color:P.gold, sub:"kills consécutifs" }),
      React.createElement(EVA.StatCard, { label:"Best Dégâts", value:n(s.bestInflictedDamage), color:P.accent, sub:"en une partie" }),
      React.createElement(EVA.StatCard, { label:"Dégâts totaux", value:(n(s.inflictedDamage)/1000).toFixed(1)+"k" }),
      React.createElement(EVA.StatCard, { label:"Distance", value:EVA.fmtDist(n(s.traveledDistance)), sub:EVA.fmtDist(n(s.traveledDistanceAverage))+" /partie" })
    ),

    !hasStats && React.createElement(EVA.Empty, { text:"Aucune donnée pour cette saison" }),

    // History
    history && history.length > 0 && React.createElement("div", null,
      React.createElement("div", { style: { fontSize:14, fontWeight:700, color:P.textSec, marginBottom:10, textTransform:"uppercase", letterSpacing:2, fontFamily:F.mono } }, "Dernières parties"),
      history.map(function(g) { return React.createElement(EVA.MatchCard, { key:g.id, game:g, meId:u.id }); })
    )
  );
};
