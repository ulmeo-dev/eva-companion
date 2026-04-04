// ═══════════════════════════════════════════════
//  EVA Companion - Friends Module
// ═══════════════════════════════════════════════

var P = EVA.P, F = EVA.F;
var useState = React.useState;

EVA.FriendsView = function(props) {
  var friends = props.friends, onSelect = props.onSelect, onRemove = props.onRemove, onAdd = props.onAdd;
  var _st = useState(""), tag = _st[0], setTag = _st[1];
  var _sn = useState(""), name = _sn[0], setName = _sn[1];

  var add = function() {
    if (!tag.trim()) return;
    onAdd({ tag:tag.trim(), name:name.trim()||tag.split("#")[0] });
    setTag(""); setName("");
  };

  var inputStyle = {
    width:"100%", padding:"10px 12px", background:P.surfaceLight,
    border:"1px solid "+P.border, borderRadius:8, color:P.text,
    fontFamily:F.mono, fontSize:14, marginBottom:8
  };

  return React.createElement("div", null,
    // Add form
    React.createElement("div", { style: { background:P.surface, borderRadius:12, padding:16, marginBottom:16, border:"1px solid "+P.border } },
      React.createElement("div", { style: { fontSize:13, fontWeight:700, color:P.textSec, marginBottom:10, fontFamily:F.mono, textTransform:"uppercase", letterSpacing:1 } }, "Ajouter un ami"),
      React.createElement("input", { value:tag, onChange:function(e){setTag(e.target.value);}, placeholder:"Tag EVA (ex: Pseudo#123456)", style:inputStyle, onKeyDown:function(e){if(e.key==="Enter")add();} }),
      React.createElement("input", { value:name, onChange:function(e){setName(e.target.value);}, placeholder:"Surnom (optionnel)", style:Object.assign({}, inputStyle, {fontFamily:F.main, marginBottom:10}), onKeyDown:function(e){if(e.key==="Enter")add();} }),
      React.createElement("button", { onClick:add, style: {
        width:"100%", padding:"10px", background:P.accent, color:P.bg,
        border:"none", borderRadius:8, fontWeight:800, fontSize:14, fontFamily:F.main,
        letterSpacing:1, textTransform:"uppercase"
      }}, "+ Ajouter")
    ),
    // List
    friends.length === 0
      ? React.createElement(EVA.Empty, { text:"Aucun ami ajouté" })
      : friends.map(function(f,i) {
          return React.createElement("div", {
            key:i, className:"fade-in",
            style: {
              background:P.surface, borderRadius:10, padding:"12px 14px", marginBottom:6,
              border:"1px solid "+P.border, display:"flex", alignItems:"center", gap:12, cursor:"pointer"
            },
            onClick: function() { onSelect(f); }
          },
            React.createElement("div", { style: {
              width:40, height:40, borderRadius:"50%",
              background:"linear-gradient(135deg, "+P.surfaceLight+", "+P.surfaceHover+")",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:16, fontWeight:700, color:P.accent, fontFamily:F.main,
              border:"2px solid "+P.accent+"33"
            }}, f.name.charAt(0).toUpperCase()),
            React.createElement("div", { style: { flex:1 } },
              React.createElement("div", { style: { fontSize:15, fontWeight:700, color:P.text, fontFamily:F.main } }, f.name),
              React.createElement("div", { style: { fontSize:11, color:P.textDim, fontFamily:F.mono } }, f.tag)
            ),
            React.createElement("button", {
              onClick: function(e) { e.stopPropagation(); onRemove(i); },
              style: { background:P.loseDim, border:"none", borderRadius:6, padding:"6px 10px", color:P.lose, fontSize:12, fontFamily:F.mono, fontWeight:700 }
            }, "\u2715")
          );
        })
  );
};
