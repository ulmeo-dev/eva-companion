// ═══════════════════════════════════════════════
//  EVA Companion - Armory Module
// ═══════════════════════════════════════════════

var P = EVA.P, F = EVA.F;
var useState = React.useState, useEffect = React.useEffect;

var _armoryCache = null;

function loadArmory() {
  if (_armoryCache) return Promise.resolve(_armoryCache);
  return fetch("data/armory/armory.json").then(function(r) { return r.json(); }).then(function(d) {
    _armoryCache = d;
    return d;
  });
}

// ── Body Diagram SVG ──
function BodyDiagram(props) {
  var damage = props.damage;
  var vals = {};
  damage.forEach(function(d) { vals[d.key.toLowerCase()] = d.value; });
  function col(v) {
    var ratio = Math.min(v / 100, 1);
    var r = Math.round(80 + ratio * 175);
    var g = Math.round(80 + (1 - ratio) * 100);
    var b = Math.round(80 + (1 - ratio) * 80);
    return "rgb("+r+","+g+","+b+")";
  }
  var head = vals.head || 0, body = vals.body || 0, other = vals.other || 0;
  return React.createElement("div", { style: { display:"flex", gap:12, alignItems:"center" } },
    React.createElement("svg", { width:60, height:120, viewBox:"0 0 60 120" },
      // Head
      React.createElement("circle", { cx:30, cy:14, r:10, fill:col(head), stroke:P.border, strokeWidth:1 }),
      // Body
      React.createElement("rect", { x:16, y:26, width:28, height:34, rx:4, fill:col(body), stroke:P.border, strokeWidth:1 }),
      // Left arm
      React.createElement("rect", { x:2, y:28, width:12, height:30, rx:4, fill:col(other), stroke:P.border, strokeWidth:1 }),
      // Right arm
      React.createElement("rect", { x:46, y:28, width:12, height:30, rx:4, fill:col(other), stroke:P.border, strokeWidth:1 }),
      // Left leg
      React.createElement("rect", { x:16, y:62, width:12, height:36, rx:4, fill:col(other), stroke:P.border, strokeWidth:1 }),
      // Right leg
      React.createElement("rect", { x:32, y:62, width:12, height:36, rx:4, fill:col(other), stroke:P.border, strokeWidth:1 })
    ),
    React.createElement("div", { style: { fontFamily:F.mono, fontSize:12 } },
      damage.map(function(d) {
        return React.createElement("div", { key:d.key, style: { display:"flex", justifyContent:"space-between", gap:12, marginBottom:3 } },
          React.createElement("span", { style: { color:P.textSec, textTransform:"capitalize" } }, d.key),
          React.createElement("span", { style: { color:P.text, fontWeight:700 } }, d.value)
        );
      })
    )
  );
}

// ── Dispersion Diagram ──
function DispersionDiagram(props) {
  var dispersion = props.dispersion;
  var colors = [P.accent, P.win, P.gold, P.lose, "#ff9800"];
  var maxVal = 0;
  dispersion.forEach(function(d) { if (d.value > maxVal) maxVal = d.value; });
  var scale = maxVal > 0 ? 40 / maxVal : 40;
  return React.createElement("div", null,
    React.createElement("svg", { width:100, height:100, viewBox:"0 0 100 100" },
      dispersion.slice().reverse().map(function(d, ri) {
        var i = dispersion.length - 1 - ri;
        var r = Math.max(d.value * scale, 2);
        return React.createElement("circle", { key:i, cx:50, cy:50, r:r, fill:"none", stroke:colors[i % colors.length], strokeWidth:1.5, opacity:0.8 });
      }),
      React.createElement("circle", { cx:50, cy:50, r:2, fill:P.text })
    ),
    React.createElement("div", { style: { fontFamily:F.mono, fontSize:11, marginTop:4 } },
      dispersion.map(function(d, i) {
        return React.createElement("div", { key:i, style: { display:"flex", alignItems:"center", gap:6, marginBottom:2 } },
          React.createElement("span", { style: { width:8, height:8, borderRadius:"50%", background:colors[i % colors.length], flexShrink:0 } }),
          React.createElement("span", { style: { color:P.textSec, flex:1 } }, d.key),
          React.createElement("span", { style: { color:P.text, fontWeight:700 } }, d.value + "\u00B0")
        );
      })
    )
  );
}

// ── Range Chart ──
function RangeChart(props) {
  var range = props.range;
  var maxDist = 0;
  range.forEach(function(r) { if (r.max > maxDist) maxDist = r.max; });
  var isLast = function(i) { return i === range.length - 1; };
  return React.createElement("div", null,
    React.createElement("div", { style: { position:"relative", height:32, background:P.surfaceLight, borderRadius:6, overflow:"hidden", marginBottom:6 } },
      range.map(function(r, i) {
        var left = (r.min / maxDist) * 100;
        var width = ((r.max - r.min) / maxDist) * 100;
        var opacity = r.value / 100;
        return React.createElement("div", { key:i, style: {
          position:"absolute", left:left+"%", width:width+"%", top:0, bottom:0,
          background:P.accent, opacity:Math.max(opacity, 0.1),
          borderRight: i < range.length - 1 ? "1px solid "+P.bg : "none"
        }});
      })
    ),
    React.createElement("div", { style: { fontFamily:F.mono, fontSize:11 } },
      range.map(function(r, i) {
        var distLabel = r.min + "-" + r.max + (isLast(i) ? "+" : "") + "m";
        return React.createElement("div", { key:i, style: { display:"flex", justifyContent:"space-between", marginBottom:2 } },
          React.createElement("span", { style: { color:P.textSec } }, distLabel),
          React.createElement("span", { style: { color:P.text, fontWeight:700 } }, r.value + "%")
        );
      })
    )
  );
}

// ── Weapon Detail View ──
function WeaponDetail(props) {
  var weapon = props.weapon, onBack = props.onBack;
  var _sm = useState(false), altMode = _sm[0], setAltMode = _sm[1];
  var hasMode = !!weapon.mode;

  var activeDamage = weapon.damage;
  var activeRange = weapon.range;
  if (altMode && hasMode) {
    activeDamage = [{ key:"all", value:weapon.mode.damage }];
    activeRange = weapon.mode.range;
  }

  return React.createElement("div", { className:"fade-in", style: { paddingBottom:20 } },
    React.createElement("button", {
      onClick: onBack,
      style: { background:"none", border:"none", color:P.accent, fontFamily:F.mono, fontSize:13, padding:"4px 0", marginBottom:12, display:"flex", alignItems:"center", gap:4 }
    }, "\u2190 Retour"),

    // Header: image + name
    React.createElement("div", { style: { display:"flex", alignItems:"center", gap:14, marginBottom:16 } },
      React.createElement("img", { src:"data/armory/"+weapon.icon, style: { width:64, height:64, objectFit:"contain", borderRadius:8, background:P.surfaceLight, padding:6 } }),
      React.createElement("div", null,
        React.createElement("div", { style: { fontSize:22, fontWeight:700, color:P.text, fontFamily:F.main, textTransform:"uppercase" } }, weapon.name),
        hasMode && React.createElement("div", { style: { display:"flex", gap:6, marginTop:6 } },
          React.createElement("button", { onClick:function(){setAltMode(false);}, style: {
            padding:"4px 10px", borderRadius:6, fontSize:11, fontFamily:F.mono, fontWeight:700,
            background:!altMode?P.accentDim:"transparent", border:"1px solid "+(!altMode?P.accent+"55":P.border), color:!altMode?P.accent:P.textSec
          }}, "Standard"),
          React.createElement("button", { onClick:function(){setAltMode(true);}, style: {
            padding:"4px 10px", borderRadius:6, fontSize:11, fontFamily:F.mono, fontWeight:700,
            background:altMode?P.accentDim:"transparent", border:"1px solid "+(altMode?P.accent+"55":P.border), color:altMode?P.accent:P.textSec
          }}, weapon.mode.name)
        )
      )
    ),

    // Cooldown (alt mode)
    altMode && hasMode && weapon.mode.cooldown && React.createElement("div", { style: {
      background:P.surface, borderRadius:10, padding:"10px 14px", marginBottom:8, border:"1px solid "+P.border,
      fontFamily:F.mono, fontSize:12, color:P.textSec, display:"flex", justifyContent:"space-between"
    }},
      React.createElement("span", null, "Cooldown"),
      React.createElement("span", { style: { color:P.accent, fontWeight:700 } }, weapon.mode.cooldown + "s")
    ),

    // Damage + Dispersion row
    React.createElement("div", { style: { display:"flex", gap:10, marginBottom:10, flexWrap:"wrap" } },
      // Damage body diagram
      React.createElement("div", { style: { background:P.surface, borderRadius:10, padding:14, border:"1px solid "+P.border, flex:"1 1 180px" } },
        React.createElement("div", { style: { fontSize:11, color:P.textSec, fontFamily:F.mono, textTransform:"uppercase", letterSpacing:1, marginBottom:8 } }, "Damage"),
        React.createElement(BodyDiagram, { damage:activeDamage })
      ),
      // Dispersion
      weapon.dispersion && React.createElement("div", { style: { background:P.surface, borderRadius:10, padding:14, border:"1px solid "+P.border, flex:"1 1 140px" } },
        React.createElement("div", { style: { fontSize:11, color:P.textSec, fontFamily:F.mono, textTransform:"uppercase", letterSpacing:1, marginBottom:8 } }, "Dispersion"),
        React.createElement(DispersionDiagram, { dispersion:weapon.dispersion })
      )
    ),

    // Range
    React.createElement("div", { style: { background:P.surface, borderRadius:10, padding:14, marginBottom:10, border:"1px solid "+P.border } },
      React.createElement("div", { style: { fontSize:11, color:P.textSec, fontFamily:F.mono, textTransform:"uppercase", letterSpacing:1, marginBottom:8 } }, "Range"),
      React.createElement(RangeChart, { range:activeRange })
    ),

    // Stats
    weapon.stats && React.createElement("div", { style: { background:P.surface, borderRadius:10, padding:14, border:"1px solid "+P.border } },
      React.createElement("div", { style: { fontSize:11, color:P.textSec, fontFamily:F.mono, textTransform:"uppercase", letterSpacing:1, marginBottom:8 } }, "Stats"),
      weapon.stats.map(function(s, i) {
        return React.createElement("div", { key:i, style: { display:"flex", justifyContent:"space-between", padding:"4px 0", borderBottom: i < weapon.stats.length - 1 ? "1px solid "+P.border : "none", fontFamily:F.mono, fontSize:12 } },
          React.createElement("span", { style: { color:P.textSec } }, s.key),
          React.createElement("span", { style: { color:P.text, fontWeight:700 } }, s.value)
        );
      })
    )
  );
}

// ── Gear Detail View ──
function GearDetail(props) {
  var gear = props.gear, onBack = props.onBack;
  return React.createElement("div", { className:"fade-in", style: { paddingBottom:20 } },
    React.createElement("button", {
      onClick: onBack,
      style: { background:"none", border:"none", color:P.accent, fontFamily:F.mono, fontSize:13, padding:"4px 0", marginBottom:12, display:"flex", alignItems:"center", gap:4 }
    }, "\u2190 Retour"),

    React.createElement("div", { style: { display:"flex", alignItems:"center", gap:14, marginBottom:16 } },
      React.createElement("img", { src:"data/armory/"+gear.icon, style: { width:64, height:64, objectFit:"contain", borderRadius:8, background:P.surfaceLight, padding:6 } }),
      React.createElement("div", { style: { fontSize:22, fontWeight:700, color:P.text, fontFamily:F.main, textTransform:"uppercase" } }, gear.name)
    ),

    gear.stats && React.createElement("div", { style: { background:P.surface, borderRadius:10, padding:14, border:"1px solid "+P.border } },
      React.createElement("div", { style: { fontSize:11, color:P.textSec, fontFamily:F.mono, textTransform:"uppercase", letterSpacing:1, marginBottom:8 } }, "Stats"),
      gear.stats.map(function(s, i) {
        return React.createElement("div", { key:i, style: { display:"flex", justifyContent:"space-between", padding:"4px 0", borderBottom: i < gear.stats.length - 1 ? "1px solid "+P.border : "none", fontFamily:F.mono, fontSize:12 } },
          React.createElement("span", { style: { color:P.textSec } }, s.key),
          React.createElement("span", { style: { color:P.text, fontWeight:700 } }, s.value)
        );
      })
    )
  );
}

// ── Item Card (list item) ──
function ItemCard(props) {
  var item = props.item, onClick = props.onClick;
  return React.createElement("div", {
    onClick: onClick,
    style: {
      background:P.surface, borderRadius:10, padding:"10px 12px", border:"1px solid "+P.border,
      display:"flex", alignItems:"center", gap:10, cursor:"pointer", transition:"background 0.15s"
    },
    onMouseEnter: function(e) { e.currentTarget.style.background=P.surfaceHover; },
    onMouseLeave: function(e) { e.currentTarget.style.background=P.surface; }
  },
    React.createElement("img", { src:"data/armory/"+item.icon, style: { width:40, height:40, objectFit:"contain", borderRadius:6, background:P.surfaceLight, padding:4 } }),
    React.createElement("span", { style: { fontSize:14, fontWeight:600, color:P.text, fontFamily:F.main, textTransform:"uppercase" } }, item.name)
  );
}

// ── Main Armory View ──
EVA.ArmoryView = function() {
  var _sd = useState(null), data = _sd[0], setData = _sd[1];
  var _sl = useState(true), loading = _sl[0], setLoading = _sl[1];
  var _st = useState("weapons"), viewType = _st[0], setViewType = _st[1];
  var _si = useState(null), selectedItem = _si[0], setSelectedItem = _si[1];
  var _sc = useState(null), selectedCategory = _sc[0], setSelectedCategory = _sc[1]; // "gear" or "weapon"

  useEffect(function() {
    loadArmory().then(function(d) { setData(d); }).finally(function() { setLoading(false); });
  }, []);

  if (loading) return React.createElement(EVA.Spinner);
  if (!data) return React.createElement(EVA.Empty, { text:"Impossible de charger l'armurerie" });

  // Detail view
  if (selectedItem && selectedCategory === "weapon") {
    return React.createElement(WeaponDetail, { weapon:selectedItem, onBack:function() { setSelectedItem(null); setSelectedCategory(null); } });
  }
  if (selectedItem && selectedCategory === "gear") {
    return React.createElement(GearDetail, { gear:selectedItem, onBack:function() { setSelectedItem(null); setSelectedCategory(null); } });
  }

  var btnStyle = function(active) {
    return {
      padding:"8px 18px", borderRadius:8, fontSize:13, fontFamily:F.mono, fontWeight:700,
      border:"1px solid "+(active ? P.accent+"55" : P.border),
      background: active ? P.accentDim : "transparent",
      color: active ? P.accent : P.textSec,
      cursor:"pointer", transition:"all 0.15s", flex:1, textAlign:"center"
    };
  };

  return React.createElement("div", { className:"fade-in", style: { paddingBottom:20 } },
    // Switch weapons / gears
    React.createElement("div", { style: { display:"flex", gap:6, marginBottom:16 } },
      React.createElement("button", { onClick:function(){setViewType("weapons");}, style:btnStyle(viewType==="weapons") }, "Weapons"),
      React.createElement("button", { onClick:function(){setViewType("gears");}, style:btnStyle(viewType==="gears") }, "Gears")
    ),

    // Gears list
    viewType === "gears" && React.createElement("div", { style: { display:"flex", flexDirection:"column", gap:6 } },
      data.gears.map(function(g, i) {
        return React.createElement(ItemCard, { key:i, item:g, onClick:function() { setSelectedItem(g); setSelectedCategory("gear"); } });
      })
    ),

    // Weapons list by category
    viewType === "weapons" && Object.keys(data.weapons).map(function(cat) {
      return React.createElement("div", { key:cat, style: { marginBottom:16 } },
        React.createElement("div", { style: { fontSize:12, fontWeight:700, color:P.accent, fontFamily:F.mono, textTransform:"uppercase", letterSpacing:2, marginBottom:8, paddingLeft:4 } }, cat),
        React.createElement("div", { style: { display:"flex", flexDirection:"column", gap:4 } },
          data.weapons[cat].map(function(w, i) {
            return React.createElement(ItemCard, { key:i, item:w, onClick:function() { setSelectedItem(w); setSelectedCategory("weapon"); } });
          })
        )
      );
    })
  );
};