// ═══════════════════════════════════════════════
//  EVA Companion - Armory Module
// ═══════════════════════════════════════════════

var P = EVA.P, F = EVA.F;
var useState = React.useState, useEffect = React.useEffect, useRef = React.useRef;

var _armoryCache = null;
function loadArmory() {
  if (_armoryCache) return Promise.resolve(_armoryCache);
  return fetch("data/armory/armory.json").then(function(r) { return r.json(); }).then(function(d) {
    _armoryCache = d;
    return d;
  });
}

// ── Helpers ──
function damageColor(v) {
  var ratio = Math.min(v / 100, 1);
  var r = Math.round(80 + ratio * 175);
  var g = Math.round(80 + (1 - ratio) * 100);
  var b = Math.round(80 + (1 - ratio) * 80);
  return "rgb("+r+","+g+","+b+")";
}

// Get all weapons as a flat list with category
function allWeapons(data) {
  var list = [];
  Object.keys(data.weapons).forEach(function(cat) {
    data.weapons[cat].forEach(function(w) {
      list.push({ weapon: w, category: cat });
    });
  });
  return list;
}

// Get damage at a given distance using the range curve (no rounding)
function damageAtDistance(weapon, distance, part) {
  var baseDmg = 0;
  if (part === "global") {
    var h = 0, b = 0, o = 0, n = 0;
    weapon.damage.forEach(function(d) {
      if (d.key === "head") { h = d.value; n++; }
      else if (d.key === "body") { b = d.value; n++; }
      else if (d.key === "other") { o = d.value; n++; }
    });
    baseDmg = n > 0 ? (h + b + o) / n : 0;
  } else {
    var found = weapon.damage.find(function(d) { return d.key === part; });
    baseDmg = found ? found.value : 0;
  }
  // Find the range multiplier at that distance
  var mult = 0;
  for (var i = 0; i < weapon.range.length; i++) {
    var r = weapon.range[i];
    if (distance >= r.min && distance < r.max) { mult = r.value / 100; break; }
    if (i === weapon.range.length - 1 && distance >= r.max) { mult = r.value / 100; }
  }
  return baseDmg * mult;
}

// Compute TTK (Time To Kill) at distance for a given body part. Returns seconds.
function ttkAtDistance(weapon, distance, part) {
  var dmg = damageAtDistance(weapon, distance, part);
  if (dmg <= 0) return Infinity;
  var bulletsNeeded = Math.ceil(100 / dmg);
  // Find cadence (rpm) in stats
  var rpm = 600;
  if (weapon.stats) {
    var c = weapon.stats.find(function(s) { return s.key.toLowerCase().indexOf("cadence") !== -1; });
    if (c) rpm = c.value;
  }
  // Time between shots in seconds
  var timePerShot = 60 / rpm;
  // Time = (bulletsNeeded - 1) shots intervals (first is instant)
  return (bulletsNeeded - 1) * timePerShot;
}

// ── Body Diagram SVG ──
function BodyDiagram(props) {
  var damage = props.damage;
  var compact = props.compact;
  var vals = {};
  damage.forEach(function(d) { vals[d.key.toLowerCase()] = d.value; });
  var head = vals.head != null ? vals.head : (vals.all || 0);
  var body = vals.body != null ? vals.body : (vals.all || 0);
  var other = vals.other != null ? vals.other : (vals.all || 0);
  var size = compact ? 50 : 60;
  var h = compact ? 100 : 120;
  return React.createElement("div", { style: { display:"flex", gap:10, alignItems:"center" } },
    React.createElement("svg", { width:size, height:h, viewBox:"0 0 60 120" },
      React.createElement("circle", { cx:30, cy:14, r:10, fill:damageColor(head), stroke:P.border, strokeWidth:1 }),
      React.createElement("rect", { x:16, y:26, width:28, height:34, rx:4, fill:damageColor(body), stroke:P.border, strokeWidth:1 }),
      React.createElement("rect", { x:2, y:28, width:12, height:30, rx:4, fill:damageColor(other), stroke:P.border, strokeWidth:1 }),
      React.createElement("rect", { x:46, y:28, width:12, height:30, rx:4, fill:damageColor(other), stroke:P.border, strokeWidth:1 }),
      React.createElement("rect", { x:16, y:62, width:12, height:36, rx:4, fill:damageColor(other), stroke:P.border, strokeWidth:1 }),
      React.createElement("rect", { x:32, y:62, width:12, height:36, rx:4, fill:damageColor(other), stroke:P.border, strokeWidth:1 })
    ),
    React.createElement("div", { style: { fontFamily:F.mono, fontSize: compact?11:12 } },
      damage.map(function(d) {
        return React.createElement("div", { key:d.key, style: { display:"flex", justifyContent:"space-between", gap:12, marginBottom:3 } },
          React.createElement("span", { style: { color:P.textSec, textTransform:"capitalize" } }, d.key),
          React.createElement("span", { style: { color:P.text, fontWeight:700 } }, d.value)
        );
      })
    )
  );
}

// ── Dispersion Diagram (single weapon) ──
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

// ── Dispersion Compare Diagram (2 weapons overlaid) ──
function DispersionCompare(props) {
  var wA = props.weaponA, wB = props.weaponB;
  var maxVal = 0;
  wA.dispersion.forEach(function(d) { if (d.value > maxVal) maxVal = d.value; });
  wB.dispersion.forEach(function(d) { if (d.value > maxVal) maxVal = d.value; });
  var scale = maxVal > 0 ? 55 / maxVal : 55;
  var colorA = P.accent, colorB = P.lose;

  return React.createElement("div", { style: { display:"flex", gap:14, alignItems:"flex-start" } },
    React.createElement("svg", { width:140, height:140, viewBox:"0 0 140 140" },
      wA.dispersion.slice().reverse().map(function(d, ri) {
        var i = wA.dispersion.length - 1 - ri;
        var r = Math.max(d.value * scale, 2);
        return React.createElement("circle", { key:"a"+i, cx:70, cy:70, r:r, fill:"none", stroke:colorA, strokeWidth:1.5, opacity:0.8, strokeDasharray: i>0 ? "3,2" : "0" });
      }),
      wB.dispersion.slice().reverse().map(function(d, ri) {
        var i = wB.dispersion.length - 1 - ri;
        var r = Math.max(d.value * scale, 2);
        return React.createElement("circle", { key:"b"+i, cx:70, cy:70, r:r, fill:"none", stroke:colorB, strokeWidth:1.5, opacity:0.8, strokeDasharray: i>0 ? "3,2" : "0" });
      }),
      React.createElement("circle", { cx:70, cy:70, r:2, fill:P.text })
    ),
    React.createElement("div", { style: { fontFamily:F.mono, fontSize:11, flex:1 } },
      React.createElement("div", { style: { color:colorA, fontWeight:700, marginBottom:4, textTransform:"uppercase" } }, wA.name),
      wA.dispersion.map(function(d, i) {
        return React.createElement("div", { key:"la"+i, style: { display:"flex", justifyContent:"space-between", color:P.textSec, marginBottom:2 } },
          React.createElement("span", null, d.key),
          React.createElement("span", { style: { color:P.text } }, d.value + "\u00B0")
        );
      }),
      React.createElement("div", { style: { color:colorB, fontWeight:700, marginTop:8, marginBottom:4, textTransform:"uppercase" } }, wB.name),
      wB.dispersion.map(function(d, i) {
        return React.createElement("div", { key:"lb"+i, style: { display:"flex", justifyContent:"space-between", color:P.textSec, marginBottom:2 } },
          React.createElement("span", null, d.key),
          React.createElement("span", { style: { color:P.text } }, d.value + "\u00B0")
        );
      })
    )
  );
}

// ── Range Chart (single weapon) ──
function RangeChart(props) {
  var range = props.range;
  var maxDist = 0;
  range.forEach(function(r) { if (r.max > maxDist) maxDist = r.max; });
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
        var isLast = i === range.length - 1;
        return React.createElement("div", { key:i, style: { display:"flex", justifyContent:"space-between", marginBottom:2 } },
          React.createElement("span", { style: { color:P.textSec } }, r.min + "-" + r.max + (isLast ? "+" : "") + "m"),
          React.createElement("span", { style: { color:P.text, fontWeight:700 } }, r.value + "%")
        );
      })
    )
  );
}

// ── TTK Comparison Graph ──
function TTKGraph(props) {
  var wA = props.weaponA, wB = props.weaponB;
  var _p = useState("body"), part = _p[0], setPart = _p[1];

  var maxDistA = 0; wA.range.forEach(function(r) { if (r.max > maxDistA) maxDistA = r.max; });
  var maxDistB = 0; wB.range.forEach(function(r) { if (r.max > maxDistB) maxDistB = r.max; });
  var maxDist = Math.max(maxDistA, maxDistB);

  // Sample TTK at many distances using the range segment breakpoints for precision
  var distances = [];
  var allBreaks = [];
  wA.range.forEach(function(r) { allBreaks.push(r.min); allBreaks.push(r.max); });
  wB.range.forEach(function(r) { allBreaks.push(r.min); allBreaks.push(r.max); });
  allBreaks = allBreaks.filter(function(v, i, a) { return a.indexOf(v) === i; }).sort(function(a,b){return a-b;});
  // Also add samples between breaks for smooth lines
  for (var d = 0; d <= maxDist; d += 0.5) distances.push(d);
  allBreaks.forEach(function(b) {
    if (distances.indexOf(b) === -1) distances.push(b);
    // Add tiny epsilon before/after to create sharp transitions
    if (b > 0.01) distances.push(b - 0.01);
    distances.push(b + 0.01);
  });
  distances = distances.filter(function(d) { return d >= 0 && d <= maxDist; }).sort(function(a,b){return a-b;});

  var pointsA = distances.map(function(d) { return { x:d, y: ttkAtDistance(wA, d, part) }; });
  var pointsB = distances.map(function(d) { return { x:d, y: ttkAtDistance(wB, d, part) }; });

  // Compute max TTK for Y scale (clamp infinite values)
  var maxTTK = 0;
  pointsA.concat(pointsB).forEach(function(p) { if (isFinite(p.y) && p.y > maxTTK) maxTTK = p.y; });
  maxTTK = Math.max(maxTTK, 0.5);

  var W = 700, H = 280, padL = 48, padR = 16, padT = 16, padB = 36;
  var chartW = W - padL - padR;
  var chartH = H - padT - padB;

  function X(d) { return padL + (d / maxDist) * chartW; }
  function Y(t) {
    if (!isFinite(t)) return padT;
    return padT + (1 - Math.min(t / maxTTK, 1)) * chartH;
  }

  function buildPath(pts) {
    var path = "";
    pts.forEach(function(p, i) {
      if (!isFinite(p.y)) return;
      path += (path ? " L" : "M") + X(p.x).toFixed(2) + " " + Y(p.y).toFixed(2);
    });
    return path;
  }

  // Grid lines
  var yTicks = [];
  var tickStep = maxTTK > 2 ? 0.5 : (maxTTK > 1 ? 0.2 : 0.1);
  for (var t = 0; t <= maxTTK; t += tickStep) yTicks.push(t);
  var xStep = maxDist > 50 ? 20 : 10;
  var xTicks = [];
  for (var x = 0; x <= maxDist; x += xStep) xTicks.push(x);

  var btnStyle = function(active) {
    return {
      padding:"6px 14px", borderRadius:6, fontSize:11, fontFamily:F.mono, fontWeight:700,
      border:"1px solid "+(active ? P.accent+"55" : P.border),
      background: active ? P.accentDim : "transparent",
      color: active ? P.accent : P.textSec,
      cursor:"pointer", textTransform:"uppercase"
    };
  };

  return React.createElement("div", { style: { background:P.surface, borderRadius:10, padding:14, border:"1px solid "+P.border, marginTop:10 } },
    React.createElement("div", { style: { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10, flexWrap:"wrap", gap:8 } },
      React.createElement("div", { style: { fontSize:11, color:P.textSec, fontFamily:F.mono, textTransform:"uppercase", letterSpacing:1 } }, "Time To Kill (100 HP)"),
      React.createElement("div", { style: { display:"flex", gap:4, flexWrap:"wrap" } },
        ["head","body","other","global"].map(function(p) {
          return React.createElement("button", { key:p, onClick:function(){setPart(p);}, style:btnStyle(part===p) }, p);
        })
      )
    ),
    React.createElement("div", { style: { width:"100%", overflowX:"auto" } },
      React.createElement("svg", { width:W, height:H, viewBox:"0 0 "+W+" "+H, style: { minWidth:W, maxWidth:"100%", height:"auto" } },
        // Grid
        yTicks.map(function(t, i) {
          return React.createElement("g", { key:"y"+i },
            React.createElement("line", { x1:padL, x2:W-padR, y1:Y(t), y2:Y(t), stroke:P.border, strokeWidth:0.5, strokeDasharray:"2,2" }),
            React.createElement("text", { x:padL-8, y:Y(t)+4, fill:P.textDim, fontSize:10, fontFamily:"monospace", textAnchor:"end" }, t.toFixed(2)+"s")
          );
        }),
        xTicks.map(function(d, i) {
          return React.createElement("g", { key:"x"+i },
            React.createElement("line", { x1:X(d), x2:X(d), y1:padT, y2:H-padB, stroke:P.border, strokeWidth:0.5, strokeDasharray:"2,2" }),
            React.createElement("text", { x:X(d), y:H-padB+16, fill:P.textDim, fontSize:10, fontFamily:"monospace", textAnchor:"middle" }, d+"m")
          );
        }),
        // Axes
        React.createElement("line", { x1:padL, x2:padL, y1:padT, y2:H-padB, stroke:P.textSec, strokeWidth:1 }),
        React.createElement("line", { x1:padL, x2:W-padR, y1:H-padB, y2:H-padB, stroke:P.textSec, strokeWidth:1 }),
        // Curves
        React.createElement("path", { d:buildPath(pointsA), fill:"none", stroke:P.accent, strokeWidth:2 }),
        React.createElement("path", { d:buildPath(pointsB), fill:"none", stroke:P.lose, strokeWidth:2 }),
        // Legend
        React.createElement("g", { transform: "translate("+(padL+12)+","+(padT+4)+")" },
          React.createElement("rect", { x:0, y:0, width:130, height:40, fill:P.surface, stroke:P.border, rx:4 }),
          React.createElement("line", { x1:8, y1:12, x2:22, y2:12, stroke:P.accent, strokeWidth:2 }),
          React.createElement("text", { x:28, y:15, fill:P.text, fontSize:11, fontFamily:"monospace" }, wA.name.toUpperCase()),
          React.createElement("line", { x1:8, y1:30, x2:22, y2:30, stroke:P.lose, strokeWidth:2 }),
          React.createElement("text", { x:28, y:33, fill:P.text, fontSize:11, fontFamily:"monospace" }, wB.name.toUpperCase())
        )
      )
    ),
    React.createElement("div", { style: { fontSize:10, color:P.textDim, fontFamily:F.mono, marginTop:8, textAlign:"center" } },
      "Temps théorique pour tuer (100 HP) • toutes balles touchent • calcul pur cadence+dégâts+range"
    )
  );
}

// ── Single weapon detail ──
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
      style: { background:"none", border:"none", color:P.accent, fontFamily:F.mono, fontSize:13, padding:"4px 0", marginBottom:12, display:"flex", alignItems:"center", gap:4, cursor:"pointer" }
    }, "\u2190 Retour"),

    React.createElement("div", { style: { display:"flex", alignItems:"center", gap:14, marginBottom:16 } },
      React.createElement("img", { src:"data/armory/"+weapon.icon, style: { width:64, height:64, objectFit:"contain", borderRadius:8, background:P.surfaceLight, padding:6 } }),
      React.createElement("div", null,
        React.createElement("div", { style: { fontSize:22, fontWeight:700, color:P.text, fontFamily:F.main, textTransform:"uppercase" } }, weapon.name),
        hasMode && React.createElement("div", { style: { display:"flex", gap:6, marginTop:6 } },
          React.createElement("button", { onClick:function(){setAltMode(false);}, style: {
            padding:"4px 10px", borderRadius:6, fontSize:11, fontFamily:F.mono, fontWeight:700,
            background:!altMode?P.accentDim:"transparent", border:"1px solid "+(!altMode?P.accent+"55":P.border), color:!altMode?P.accent:P.textSec, cursor:"pointer"
          }}, "Standard"),
          React.createElement("button", { onClick:function(){setAltMode(true);}, style: {
            padding:"4px 10px", borderRadius:6, fontSize:11, fontFamily:F.mono, fontWeight:700,
            background:altMode?P.accentDim:"transparent", border:"1px solid "+(altMode?P.accent+"55":P.border), color:altMode?P.accent:P.textSec, cursor:"pointer"
          }}, weapon.mode.name)
        )
      )
    ),

    altMode && hasMode && weapon.mode.cooldown && React.createElement("div", { style: {
      background:P.surface, borderRadius:10, padding:"10px 14px", marginBottom:8, border:"1px solid "+P.border,
      fontFamily:F.mono, fontSize:12, color:P.textSec, display:"flex", justifyContent:"space-between"
    }},
      React.createElement("span", null, "Cooldown"),
      React.createElement("span", { style: { color:P.accent, fontWeight:700 } }, weapon.mode.cooldown + "s")
    ),

    React.createElement("div", { style: { display:"flex", gap:10, marginBottom:10, flexWrap:"wrap" } },
      React.createElement("div", { style: { background:P.surface, borderRadius:10, padding:14, border:"1px solid "+P.border, flex:"1 1 180px" } },
        React.createElement("div", { style: { fontSize:11, color:P.textSec, fontFamily:F.mono, textTransform:"uppercase", letterSpacing:1, marginBottom:8 } }, "Damage"),
        React.createElement(BodyDiagram, { damage:activeDamage })
      ),
      weapon.dispersion && React.createElement("div", { style: { background:P.surface, borderRadius:10, padding:14, border:"1px solid "+P.border, flex:"1 1 140px" } },
        React.createElement("div", { style: { fontSize:11, color:P.textSec, fontFamily:F.mono, textTransform:"uppercase", letterSpacing:1, marginBottom:8 } }, "Dispersion"),
        React.createElement(DispersionDiagram, { dispersion:weapon.dispersion })
      )
    ),

    React.createElement("div", { style: { background:P.surface, borderRadius:10, padding:14, marginBottom:10, border:"1px solid "+P.border } },
      React.createElement("div", { style: { fontSize:11, color:P.textSec, fontFamily:F.mono, textTransform:"uppercase", letterSpacing:1, marginBottom:8 } }, "Range"),
      React.createElement(RangeChart, { range:activeRange })
    ),

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

// ── Gear detail ──
function GearDetail(props) {
  var gear = props.gear, onBack = props.onBack;
  return React.createElement("div", { className:"fade-in", style: { paddingBottom:20 } },
    React.createElement("button", {
      onClick: onBack,
      style: { background:"none", border:"none", color:P.accent, fontFamily:F.mono, fontSize:13, padding:"4px 0", marginBottom:12, display:"flex", alignItems:"center", gap:4, cursor:"pointer" }
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

// ── Item card for list ──
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

// ── Weapon picker dropdown ──
function WeaponPicker(props) {
  var weapons = props.weapons, selected = props.selected, onSelect = props.onSelect, color = props.color, label = props.label;
  var _o = useState(false), open = _o[0], setOpen = _o[1];
  var _f = useState(""), filter = _f[0], setFilter = _f[1];
  var ref = useRef(null);

  useEffect(function() {
    function h(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", h);
    return function() { document.removeEventListener("mousedown", h); };
  }, []);

  var filtered = weapons;
  if (filter.trim()) {
    var q = filter.trim().toLowerCase();
    filtered = weapons.filter(function(item) {
      return item.weapon.name.toLowerCase().indexOf(q) !== -1 || item.category.toLowerCase().indexOf(q) !== -1;
    });
  }

  // Group by category
  var byCategory = {};
  filtered.forEach(function(item) {
    if (!byCategory[item.category]) byCategory[item.category] = [];
    byCategory[item.category].push(item.weapon);
  });

  return React.createElement("div", { ref: ref, style: { position:"relative", flex:1, minWidth:200 } },
    React.createElement("div", { style: { fontSize:10, color:color, fontFamily:F.mono, marginBottom:4, textTransform:"uppercase", letterSpacing:1, fontWeight:700 } }, label),
    React.createElement("div", {
      onClick: function() { setOpen(!open); },
      style: {
        padding:"10px 12px", background:P.surface, borderRadius:10,
        border:"1px solid "+(open ? color : P.border),
        display:"flex", alignItems:"center", gap:10, cursor:"pointer", transition:"all 0.2s"
      }
    },
      selected
        ? React.createElement(React.Fragment, null,
            React.createElement("img", { src:"data/armory/"+selected.icon, style: { width:28, height:28, objectFit:"contain", borderRadius:4, background:P.surfaceLight, padding:2 } }),
            React.createElement("span", { style: { flex:1, fontSize:13, fontWeight:700, color:P.text, fontFamily:F.main, textTransform:"uppercase" } }, selected.name)
          )
        : React.createElement("span", { style: { flex:1, fontSize:13, color:P.textDim, fontFamily:F.main } }, "Choisir une arme..."),
      React.createElement("span", { style: { fontSize:10, color:P.textDim, transform: open?"rotate(180deg)":"rotate(0)", transition:"transform 0.2s" } }, "\u25BC")
    ),
    open && React.createElement("div", { style: {
      position:"absolute", top:"100%", left:0, right:0, zIndex:200,
      background:P.surface, border:"1px solid "+P.border, borderRadius:10, marginTop:4,
      maxHeight:380, overflow:"hidden", display:"flex", flexDirection:"column",
      boxShadow:"0 8px 32px rgba(0,0,0,0.5)"
    }},
      React.createElement("div", { style: { padding:"8px 10px", borderBottom:"1px solid "+P.border } },
        React.createElement("input", {
          value: filter, onChange: function(e) { setFilter(e.target.value); },
          placeholder: "Rechercher...", autoFocus: true,
          style: { width:"100%", padding:"6px 10px", background:P.surfaceLight, border:"1px solid "+P.border, borderRadius:6, color:P.text, fontFamily:F.mono, fontSize:12 }
        })
      ),
      React.createElement("div", { style: { overflowY:"auto", maxHeight:330 } },
        Object.keys(byCategory).map(function(cat) {
          return React.createElement("div", { key:cat },
            React.createElement("div", { style: { padding:"6px 12px", fontSize:10, color:P.textDim, fontFamily:F.mono, textTransform:"uppercase", letterSpacing:1, background:P.surfaceLight } }, cat),
            byCategory[cat].map(function(w, i) {
              return React.createElement("div", { key:cat+i,
                onClick: function() { onSelect(w); setOpen(false); setFilter(""); },
                style: { padding:"8px 12px", display:"flex", alignItems:"center", gap:10, cursor:"pointer", borderBottom:"1px solid "+P.border },
                onMouseEnter: function(e) { e.currentTarget.style.background=P.surfaceHover; },
                onMouseLeave: function(e) { e.currentTarget.style.background="transparent"; }
              },
                React.createElement("img", { src:"data/armory/"+w.icon, style: { width:26, height:26, objectFit:"contain", borderRadius:4, background:P.surfaceLight, padding:2 } }),
                React.createElement("span", { style: { fontSize:12, color:P.text, fontFamily:F.main, textTransform:"uppercase", fontWeight:600 } }, w.name)
              );
            })
          );
        })
      )
    )
  );
}

// ── Weapon Compare View ──
function WeaponCompare(props) {
  var data = props.data;
  var weapons = allWeapons(data);
  var _a = useState(null), wA = _a[0], setWA = _a[1];
  var _b = useState(null), wB = _b[0], setWB = _b[1];

  var side = function(w, color) {
    return React.createElement("div", { style: { background:P.surface, borderRadius:10, padding:14, border:"1px solid "+color+"44", flex:1, minWidth:0 } },
      React.createElement("div", { style: { display:"flex", alignItems:"center", gap:10, marginBottom:12 } },
        React.createElement("img", { src:"data/armory/"+w.icon, style: { width:48, height:48, objectFit:"contain", borderRadius:6, background:P.surfaceLight, padding:4 } }),
        React.createElement("span", { style: { fontSize:16, fontWeight:700, color:color, fontFamily:F.main, textTransform:"uppercase" } }, w.name)
      ),
      // Damage
      React.createElement("div", { style: { marginBottom:12 } },
        React.createElement("div", { style: { fontSize:10, color:P.textDim, fontFamily:F.mono, textTransform:"uppercase", letterSpacing:1, marginBottom:6 } }, "Damage"),
        React.createElement(BodyDiagram, { damage:w.damage, compact:true })
      ),
      // Stats
      w.stats && React.createElement("div", null,
        React.createElement("div", { style: { fontSize:10, color:P.textDim, fontFamily:F.mono, textTransform:"uppercase", letterSpacing:1, marginBottom:6 } }, "Stats"),
        w.stats.map(function(s, i) {
          return React.createElement("div", { key:i, style: { display:"flex", justifyContent:"space-between", padding:"3px 0", borderBottom: i < w.stats.length - 1 ? "1px solid "+P.border : "none", fontFamily:F.mono, fontSize:11 } },
            React.createElement("span", { style: { color:P.textSec } }, s.key),
            React.createElement("span", { style: { color:P.text, fontWeight:700 } }, s.value)
          );
        })
      )
    );
  };

  return React.createElement("div", { className:"fade-in", style: { paddingBottom:20 } },
    // Pickers
    React.createElement("div", { style: { display:"flex", gap:12, marginBottom:16, flexWrap:"wrap" } },
      React.createElement(WeaponPicker, { weapons:weapons, selected:wA, onSelect:setWA, color:P.accent, label:"Arme 1" }),
      React.createElement(WeaponPicker, { weapons:weapons, selected:wB, onSelect:setWB, color:P.lose, label:"Arme 2" })
    ),

    (!wA || !wB) && React.createElement(EVA.Empty, { text:"Sélectionnez deux armes" }),

    wA && wB && React.createElement("div", null,
      // Side-by-side: damage + stats
      React.createElement("div", { style: { display:"flex", gap:10, marginBottom:10, flexWrap:"wrap" } },
        side(wA, P.accent),
        side(wB, P.lose)
      ),

      // Ranges stacked
      React.createElement("div", { style: { background:P.surface, borderRadius:10, padding:14, marginBottom:10, border:"1px solid "+P.border } },
        React.createElement("div", { style: { fontSize:11, color:P.textSec, fontFamily:F.mono, textTransform:"uppercase", letterSpacing:1, marginBottom:8 } }, "Range"),
        React.createElement("div", { style: { fontSize:11, color:P.accent, fontFamily:F.mono, marginBottom:4, fontWeight:700, textTransform:"uppercase" } }, wA.name),
        React.createElement(RangeChart, { range:wA.range }),
        React.createElement("div", { style: { fontSize:11, color:P.lose, fontFamily:F.mono, marginTop:10, marginBottom:4, fontWeight:700, textTransform:"uppercase" } }, wB.name),
        React.createElement(RangeChart, { range:wB.range })
      ),

      // Dispersion overlaid
      wA.dispersion && wB.dispersion && React.createElement("div", { style: { background:P.surface, borderRadius:10, padding:14, marginBottom:10, border:"1px solid "+P.border } },
        React.createElement("div", { style: { fontSize:11, color:P.textSec, fontFamily:F.mono, textTransform:"uppercase", letterSpacing:1, marginBottom:8 } }, "Dispersion"),
        React.createElement(DispersionCompare, { weaponA:wA, weaponB:wB })
      ),

      // TTK Graph
      React.createElement(TTKGraph, { weaponA:wA, weaponB:wB })
    )
  );
}

// ── Main Armory View ──
EVA.ArmoryView = function() {
  var _sd = useState(null), data = _sd[0], setData = _sd[1];
  var _sl = useState(true), loading = _sl[0], setLoading = _sl[1];
  var _st = useState("weapons"), viewType = _st[0], setViewType = _st[1];
  var _si = useState(null), selectedItem = _si[0], setSelectedItem = _si[1];
  var _sc = useState(null), selectedCategory = _sc[0], setSelectedCategory = _sc[1];

  useEffect(function() {
    loadArmory().then(function(d) { setData(d); }).finally(function() { setLoading(false); });
  }, []);

  if (loading) return React.createElement(EVA.Spinner);
  if (!data) return React.createElement(EVA.Empty, { text:"Impossible de charger l'armurerie" });

  if (selectedItem && selectedCategory === "weapon") {
    return React.createElement(WeaponDetail, { weapon:selectedItem, onBack:function() { setSelectedItem(null); setSelectedCategory(null); } });
  }
  if (selectedItem && selectedCategory === "gear") {
    return React.createElement(GearDetail, { gear:selectedItem, onBack:function() { setSelectedItem(null); setSelectedCategory(null); } });
  }

  var btnStyle = function(active) {
    return {
      padding:"8px 14px", borderRadius:8, fontSize:13, fontFamily:F.mono, fontWeight:700,
      border:"1px solid "+(active ? P.accent+"55" : P.border),
      background: active ? P.accentDim : "transparent",
      color: active ? P.accent : P.textSec,
      cursor:"pointer", transition:"all 0.15s", flex:1, textAlign:"center"
    };
  };

  return React.createElement("div", { className:"fade-in", style: { paddingBottom:20 } },
    React.createElement("div", { style: { display:"flex", gap:6, marginBottom:16 } },
      React.createElement("button", { onClick:function(){setViewType("weapons");}, style:btnStyle(viewType==="weapons") }, "Weapons"),
      React.createElement("button", { onClick:function(){setViewType("gears");}, style:btnStyle(viewType==="gears") }, "Gears"),
      React.createElement("button", { onClick:function(){setViewType("compare");}, style:btnStyle(viewType==="compare") }, "Compare")
    ),

    viewType === "compare" && React.createElement(WeaponCompare, { data:data }),

    viewType === "gears" && React.createElement("div", { style: { display:"flex", flexDirection:"column", gap:6 } },
      data.gears.map(function(g, i) {
        return React.createElement(ItemCard, { key:i, item:g, onClick:function() { setSelectedItem(g); setSelectedCategory("gear"); } });
      })
    ),

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