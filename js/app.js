// ═══════════════════════════════════════════════
//  EVA Companion - App Module
//  State management, routing, layout
// ═══════════════════════════════════════════════

var useState = React.useState, useEffect = React.useEffect, useCallback = React.useCallback, useRef = React.useRef;
var P = EVA.P, F = EVA.F, TABS = EVA.TABS;

// ── Setup screen ──
function SetupScreen(props) {
  var onDone = props.onDone;
  var _st = useState(""), tag = _st[0], setTag = _st[1];
  var _sl = useState(false), loading = _sl[0], setLoading = _sl[1];
  var _se = useState(""), error = _se[0], setError = _se[1];

  var submit = async function() {
    if (!tag.trim()) return;
    setLoading(true); setError("");
    try {
      var p = await EVA.fetchProfile(tag.trim());
      if (p) { EVA.saveMyTag(tag.trim()); onDone(tag.trim()); }
      else { setError("Profil non trouvé. Vérifie le tag (avec le #)."); }
    } catch(e) { setError("Erreur : " + e.message); }
    setLoading(false);
  };

  return React.createElement("div", { style: {
    minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center",
    justifyContent:"center", padding:32, background:P.bg
  }},
    React.createElement("div", { style: { position:"relative", marginBottom: 16 } },
      React.createElement("div", { style: {
        position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)",
        width:180, height:180, borderRadius:"50%",
        background:"radial-gradient(circle, rgba(0,229,255,0.2) 0%, rgba(0,229,255,0.08) 30%, transparent 60%)",
        filter:"blur(25px)", pointerEvents:"none"
      }}),
      React.createElement("img", {
        src: "data/logo.png", alt: "EVA Companion",
        style: {
          width: 150, height: 150, objectFit: "contain", borderRadius: 28, position:"relative",
          filter: "drop-shadow(0 0 25px rgba(0,229,255,0.35)) drop-shadow(0 0 50px rgba(0,229,255,0.2))",
          maskImage: "radial-gradient(ellipse 70% 70% at center, black 40%, transparent 65%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 70% at center, black 40%, transparent 65%)"
        },
        onError: function(e) { e.target.parentElement.style.display = "none"; }
      })
    ),
    React.createElement("div", { style: { display:"flex", alignItems:"baseline", gap:8, marginBottom:30 } },
      React.createElement("span", { style: { fontSize:14, color:P.textDim, fontFamily:F.mono } }, "companion"),
      React.createElement("span", { style: { fontSize:10, color:P.textDim, fontFamily:F.mono, opacity:0.5 } }, "by Ulmeo")
    ),
    React.createElement("div", { style: { fontSize:14, color:P.textSec, marginBottom:16, textAlign:"center" } }, "Entre ton tag EVA pour commencer"),
    React.createElement("input", {
      value:tag, onChange:function(e){setTag(e.target.value);},
      placeholder:"Pseudo#123456",
      style: { width:"100%", maxWidth:300, padding:"14px 16px", background:P.surfaceLight, border:"1px solid "+P.border, borderRadius:10, color:P.text, fontFamily:F.mono, fontSize:16, textAlign:"center", marginBottom:12 },
      onKeyDown: function(e) { if(e.key==="Enter") submit(); }
    }),
    error && React.createElement("div", { style: { color:P.lose, fontSize:12, marginBottom:8, fontFamily:F.mono } }, error),
    React.createElement("button", {
      onClick: submit, disabled: loading,
      style: { width:"100%", maxWidth:300, padding:"14px", background:P.accent, color:P.bg, border:"none", borderRadius:10, fontWeight:800, fontSize:16, fontFamily:F.main, letterSpacing:1, textTransform:"uppercase", opacity:loading?0.6:1 }
    }, loading ? "Chargement..." : "C'est parti")
  );
}

// ── Main App ──
function App() {
  var _s = function(init) { return useState(init); };
  var myTag_s = _s(EVA.loadMyTag()), myTag = myTag_s[0], setMyTag = myTag_s[1];
  var tab_s = _s("profile"), tab = tab_s[0], setTab = tab_s[1];
  var myProfile_s = _s(null), myProfile = myProfile_s[0], setMyProfile = myProfile_s[1];
  var myHistory_s = _s([]), myHistory = myHistory_s[0], setMyHistory = myHistory_s[1];
  var loading_s = _s(false), loading = loading_s[0], setLoading = loading_s[1];
  var friends_s = _s(EVA.loadFriends()), friends = friends_s[0], setFriends = friends_s[1];
  var friendTag_s = _s(null), friendTag = friendTag_s[0], setFriendTag = friendTag_s[1];
  var friendProfile_s = _s(null), friendProfile = friendProfile_s[0], setFriendProfile = friendProfile_s[1];
  var friendHistory_s = _s([]), friendHistory = friendHistory_s[0], setFriendHistory = friendHistory_s[1];
  var friendLoading_s = _s(false), friendLoading = friendLoading_s[0], setFriendLoading = friendLoading_s[1];
  var subTab_s = _s("list"), subTab = subTab_s[0], setSubTab = subTab_s[1];
  var searchTag_s = _s(""), searchTag = searchTag_s[0], setSearchTag = searchTag_s[1];
  var searchResult_s = _s(null), searchResult = searchResult_s[0], setSearchResult = searchResult_s[1];
  var searchLoading_s = _s(false), searchLoading = searchLoading_s[0], setSearchLoading = searchLoading_s[1];
  var searchTagA_s = _s(""), searchTagA = searchTagA_s[0], setSearchTagA = searchTagA_s[1];
  var compareA_s = _s(null), compareA = compareA_s[0], setCompareA = compareA_s[1];
  var compareALoading_s = _s(false), compareALoading = compareALoading_s[0], setCompareALoading = compareALoading_s[1];
  var seasons_s = _s([]), seasons = seasons_s[0], setSeasons = seasons_s[1];
  var seasonId_s = _s(null), seasonId = seasonId_s[0], setSeasonId = seasonId_s[1];

  var myProfileRef = useRef(null);
  var prevSeasonRef = useRef(null);

  // Load seasons
  useEffect(function() {
    EVA.fetchSeasons().then(function(list) {
      setSeasons(list);
      var active = list.find(function(s) { return s.active; });
      if (active) { EVA._activeSeasonId = active.id; setSeasonId(active.id); }
      else if (list.length > 0) { setSeasonId(list[list.length - 1].id); }
    }).catch(function(e) { console.error("Failed to load seasons", e); });
  }, []);

  // Unified data loader
  useEffect(function() {
    if (!myTag || !seasonId) return;
    var cancelled = false;
    if (prevSeasonRef.current !== null && prevSeasonRef.current !== seasonId) EVA.clearFetchQueue();
    prevSeasonRef.current = seasonId;

    async function loadAll() {
      setLoading(true);
      try {
        var p = await EVA.safeFetchProfile(myTag, seasonId);
        if (cancelled) return;
        if (p) { myProfileRef.current = p; setMyProfile(p); }
        else if (myProfileRef.current) { setMyProfile(Object.assign({}, myProfileRef.current, { statistics: null, experience: null })); }
        var h = (p && p.user) ? await EVA.safeFetchHistory(p.user.id, seasonId) : [];
        if (!cancelled) setMyHistory(h || []);
      } catch(e) {}
      if (!cancelled) setLoading(false);

      if (!cancelled && friendTag && subTab === "profile") {
        setFriendLoading(true);
        try {
          var fp = await EVA.safeFetchProfile(friendTag, seasonId);
          if (cancelled) return;
          if (fp) setFriendProfile(fp);
          else setFriendProfile(function(prev) { return prev && prev.user ? Object.assign({}, prev, { statistics: null, experience: null }) : prev; });
          var fh = (fp && fp.user) ? await EVA.safeFetchHistory(fp.user.id, seasonId) : [];
          if (!cancelled) setFriendHistory(fh || []);
        } catch(e) {}
        if (!cancelled) setFriendLoading(false);
      }

      if (!cancelled && searchTagA && compareA) {
        setCompareALoading(true);
        try {
          var ca = await EVA.safeFetchProfile(searchTagA, seasonId);
          if (cancelled) return;
          if (ca) setCompareA(ca);
          else setCompareA(function(prev) { return prev && prev.user ? Object.assign({}, prev, { statistics: null, experience: null }) : prev; });
        } catch(e) {}
        if (!cancelled) setCompareALoading(false);
      }

      if (!cancelled && searchTag && searchResult) {
        setSearchLoading(true);
        try {
          var cb = await EVA.safeFetchProfile(searchTag, seasonId);
          if (cancelled) return;
          if (cb) setSearchResult(cb);
          else setSearchResult(function(prev) { return prev && prev.user ? Object.assign({}, prev, { statistics: null, experience: null }) : prev; });
        } catch(e) {}
        if (!cancelled) setSearchLoading(false);
      }
    }
    loadAll();
    return function() { cancelled = true; };
  }, [myTag, seasonId]);

  // Friend loader
  var loadFriend = useCallback(function(f) {
    if (friendTag === f.tag && friendProfile) return;
    setFriendTag(f.tag); setSubTab("profile"); setFriendLoading(true); setFriendProfile(null); setFriendHistory([]);
    EVA.safeFetchProfile(f.tag, seasonId).then(function(p) {
      setFriendProfile(p);
      return p && p.user ? EVA.safeFetchHistory(p.user.id, seasonId) : [];
    }).then(function(h) { setFriendHistory(h || []); }).finally(function() { setFriendLoading(false); });
  }, [seasonId, friendTag, friendProfile]);

  var addFriend = useCallback(function(f) { var u = friends.concat([f]); setFriends(u); EVA.saveFriends(u); }, [friends]);
  var removeFriend = useCallback(function(i) { var u = friends.filter(function(_,j){return j!==i;}); setFriends(u); EVA.saveFriends(u); }, [friends]);

  var doCompareSearch = useCallback(function(tag, setter, loadingSetter) {
    var t = (tag || "").trim();
    if (!t || !seasonId || !t.includes("#")) return;
    loadingSetter(true);
    EVA.safeFetchProfile(t, seasonId).then(function(p) { setter(p); }).finally(function() { loadingSetter(false); });
  }, [seasonId]);

  var handleSearchA = useCallback(function() { doCompareSearch(searchTagA, setCompareA, setCompareALoading); }, [searchTagA, doCompareSearch]);
  var handleSearchB = useCallback(function() { doCompareSearch(searchTag, setSearchResult, setSearchLoading); }, [searchTag, doCompareSearch]);

  if (!myTag) return React.createElement(SetupScreen, { onDone: setMyTag });

  // ── Render ──
  return React.createElement("div", { className:"app-shell", style: { background:P.bg, color:P.text, fontFamily:F.main } },

    // Desktop Sidebar
    React.createElement("div", { className:"app-sidebar" },
      React.createElement("div", { style: { padding:"16px 20px 20px" } },
        React.createElement("div", { style: { display:"flex", alignItems:"baseline", gap:6 } },
          React.createElement("span", { style: { fontSize:22, fontWeight:800, fontFamily:F.title, background:"linear-gradient(90deg, "+P.accent+", #0088a0)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" } }, "EVA"),
          React.createElement("span", { style: { fontSize:13, color:P.textDim, fontFamily:F.mono } }, "companion")
        ),
        React.createElement("div", { style: { fontSize:10, color:P.textDim, fontFamily:F.mono, opacity:0.5, marginTop:2 } },
          "by Ulmeo" + (seasonId && seasons.length ? " \u2022 " + (function(){ var s=seasons.find(function(x){return x.id===seasonId;}); return s ? EVA.seasonShort(s) : ""; })() : "")
        )
      ),
      React.createElement("div", { style: { flex:1, padding:"0 6px", display:"flex", flexDirection:"column", justifyContent:"center", gap:2, overflow:"hidden" } },
        TABS.map(function(t) {
          var active = tab === t.id;
          return React.createElement("button", {
            key:t.id, onClick: function() { setTab(t.id); if(t.id==="friends") setSubTab("list"); },
            style: { display:"flex", alignItems:"center", justifyContent:"center", width:"100%", padding:"4px 6px", borderRadius:8,
              background: active ? P.accentDim : "transparent", border: active ? "1px solid "+P.accent+"33" : "1px solid transparent",
              transition:"all 0.2s", flexShrink:1 }
          },
            React.createElement("img", { src:t.menuImg, style: { width:"100%", maxHeight:"calc((100vh - 140px) / 4)", objectFit:"contain",
              filter: active ? "drop-shadow(0 0 6px rgba(0,229,255,0.3))" : "grayscale(0.5) opacity(0.5)",
              transition:"all 0.2s" } })
          );
        })
      ),
      React.createElement("div", { style: { padding:"12px 20px", borderTop:"1px solid "+P.border, fontSize:10, color:P.textDim, fontFamily:F.mono } },
        myProfile ? myProfile.user.displayName + " \u2022 LVL " + (myProfile.experience ? myProfile.experience.level : "?") : myTag
      )
    ),

    // Main column
    React.createElement("div", { style: { flex:1, display:"flex", flexDirection:"column", height:"100vh", overflow:"hidden" } },

      // Mobile header
      React.createElement("div", { className:"app-header-mobile", style: {
        padding:"max(44px, env(safe-area-inset-top)) 16px 10px", background:P.surface,
        borderBottom:"1px solid "+P.border, flexShrink:0
      }},
        React.createElement("div", { style: { display:"flex", alignItems:"center", justifyContent:"space-between" } },
          React.createElement("div", { style: { display:"flex", alignItems:"baseline", gap: 6 } },
            React.createElement("span", { style: { fontSize:20, fontWeight:800, fontFamily:F.title, background:"linear-gradient(90deg, "+P.accent+", #0088a0)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" } }, "EVA"),
            React.createElement("span", { style: { fontSize:14, color:P.textDim, fontFamily:F.mono } }, "companion"),
            React.createElement("span", { style: { fontSize:10, color:P.textDim, fontFamily:F.mono, opacity:0.5 } }, "by Ulmeo")
          ),
          React.createElement("span", { style: { fontSize:10, color:P.textDim, fontFamily:F.mono } },
            seasonId && seasons.length ? (function(){ var s=seasons.find(function(x){return x.id===seasonId;}); return s ? "S"+s.seasonNumber : ""; })() : ""
          )
        )
      ),

      // Content
      React.createElement("div", { className:"app-content", style: { flex:1, padding:16, paddingBottom:100, overflowY:"auto", WebkitOverflowScrolling:"touch", width:"100%" } },

        tab !== "look4pvp" && seasons.length > 0 && React.createElement(EVA.SeasonSelector, { seasons:seasons, selectedId:seasonId, onChange:setSeasonId }),

        tab === "profile" && React.createElement(EVA.ProfileView, { data:myProfile, history:myHistory, loading:loading, seasons:seasons, currentSeasonId:seasonId }),

        tab === "friends" && (
          subTab === "profile"
            ? React.createElement("div", null,
                React.createElement("button", {
                  onClick: function() { setSubTab("list"); setFriendTag(null); setFriendProfile(null); setFriendHistory([]); },
                  style: { background:"none", border:"none", color:P.accent, fontFamily:F.mono, fontSize:13, padding:"4px 0", marginBottom:12, display:"flex", alignItems:"center", gap:4 }
                }, "\u2190 Retour"),
                React.createElement(EVA.ProfileView, { data:friendProfile, history:friendHistory, loading:friendLoading, seasons:seasons, currentSeasonId:seasonId })
              )
            : React.createElement(EVA.FriendsView, { friends:friends, onSelect:loadFriend, onRemove:removeFriend, onAdd:addFriend })
        ),

        tab === "compare" && React.createElement("div", null,
          React.createElement("div", { style: { background:P.surface, borderRadius:12, padding:16, marginBottom:16, border:"1px solid "+P.border } },
            React.createElement("div", { style: { fontSize:12, fontWeight:700, color:P.textSec, marginBottom:10, fontFamily:F.mono, textTransform:"uppercase", letterSpacing:1 } }, "Comparer deux joueurs"),
            // Player 1
            React.createElement("div", { style: { fontSize:12, color:P.textDim, marginBottom:4, fontFamily:F.mono } }, "Joueur 1"),
            React.createElement("div", { style: { display:"flex", gap:6, marginBottom:4 } },
              React.createElement("input", { value:searchTagA, onChange:function(e){setSearchTagA(e.target.value);}, placeholder:"Tag EVA (ex: Pseudo#123456)",
                style: { flex:1, padding:"10px 12px", background:P.surfaceLight, border:"1px solid "+P.border, borderRadius:8, color:P.text, fontFamily:F.mono, fontSize:13 },
                onKeyDown: function(e){ if(e.key==="Enter") handleSearchA(); } }),
              React.createElement("button", { onClick: handleSearchA, disabled: compareALoading || !searchTagA.trim(),
                style: { padding:"10px 14px", background: compareALoading ? P.surfaceHover : P.accent, color:P.bg, border:"none", borderRadius:8, fontWeight:800, fontFamily:F.main, fontSize:13, opacity: compareALoading || !searchTagA.trim() ? 0.5 : 1 }
              }, compareALoading ? "..." : "GO")
            ),
            React.createElement("div", { style: { display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 } },
              React.createElement("button", {
                onClick: function(){ if (compareA && compareA.user && compareA.user.username === myTag) return; setSearchTagA(myTag); setCompareA(myProfile); },
                disabled: compareA && compareA.user && compareA.user.username === myTag,
                style: { padding:"4px 8px", background:P.accentDim, border:"1px solid "+P.accent+"33", borderRadius:6, color:P.accent, fontSize:10, fontFamily:F.mono, fontWeight:700, opacity: compareA && compareA.user && compareA.user.username === myTag ? 0.5 : 1 }
              }, "Moi"),
              friends.map(function(f,i) {
                var sel = compareA && compareA.user && compareA.user.username === f.tag;
                return React.createElement("button", { key:"a"+i, disabled: sel || compareALoading,
                  onClick: function() { if(sel) return; setSearchTagA(f.tag); doCompareSearch(f.tag, setCompareA, setCompareALoading); },
                  style: { padding:"4px 8px", background: sel ? P.accent+"33" : P.surfaceHover, border:"1px solid "+P.border, borderRadius:6, color: sel ? P.accent : P.textSec, fontSize:10, fontFamily:F.mono, opacity: sel ? 0.5 : 1 }
                }, f.name);
              })
            ),
            compareA && compareA.user && React.createElement("div", { style: { padding:"6px 10px", background:P.surfaceLight, borderRadius:6, marginBottom:12, color:P.accent, fontFamily:F.mono, fontSize:12, display:"flex", alignItems:"center", gap:6 } },
              React.createElement("span", null, "\u2713"), React.createElement("span", null, compareA.user.displayName + (compareA.experience ? " (LVL " + compareA.experience.level + ")" : ""))
            ),
            // Player 2
            React.createElement("div", { style: { fontSize:12, color:P.textDim, marginBottom:4, fontFamily:F.mono } }, "Joueur 2"),
            React.createElement("div", { style: { display:"flex", gap:6, marginBottom:4 } },
              React.createElement("input", { value:searchTag, onChange:function(e){setSearchTag(e.target.value);}, placeholder:"Tag EVA (ex: Pseudo#123456)",
                style: { flex:1, padding:"10px 12px", background:P.surfaceLight, border:"1px solid "+P.border, borderRadius:8, color:P.text, fontFamily:F.mono, fontSize:13 },
                onKeyDown: function(e){ if(e.key==="Enter") handleSearchB(); } }),
              React.createElement("button", { onClick: handleSearchB, disabled: searchLoading || !searchTag.trim(),
                style: { padding:"10px 14px", background: searchLoading ? P.surfaceHover : P.accent, color:P.bg, border:"none", borderRadius:8, fontWeight:800, fontFamily:F.main, fontSize:13, opacity: searchLoading || !searchTag.trim() ? 0.5 : 1 }
              }, searchLoading ? "..." : "GO")
            ),
            React.createElement("div", { style: { display:"flex", gap:6, flexWrap:"wrap" } },
              React.createElement("button", {
                onClick: function(){ if (searchResult && searchResult.user && searchResult.user.username === myTag) return; setSearchTag(myTag); setSearchResult(myProfile); },
                disabled: searchResult && searchResult.user && searchResult.user.username === myTag,
                style: { padding:"4px 8px", background:P.accentDim, border:"1px solid "+P.accent+"33", borderRadius:6, color:P.accent, fontSize:10, fontFamily:F.mono, fontWeight:700, opacity: searchResult && searchResult.user && searchResult.user.username === myTag ? 0.5 : 1 }
              }, "Moi"),
              friends.map(function(f,i) {
                var sel = searchResult && searchResult.user && searchResult.user.username === f.tag;
                return React.createElement("button", { key:"b"+i, disabled: sel || searchLoading,
                  onClick: function() { if(sel) return; setSearchTag(f.tag); doCompareSearch(f.tag, setSearchResult, setSearchLoading); },
                  style: { padding:"4px 8px", background: sel ? P.accent+"33" : P.surfaceHover, border:"1px solid "+P.border, borderRadius:6, color: sel ? P.accent : P.textSec, fontSize:10, fontFamily:F.mono, opacity: sel ? 0.5 : 1 }
                }, f.name);
              })
            ),
            searchResult && searchResult.user && React.createElement("div", { style: { padding:"6px 10px", background:P.surfaceLight, borderRadius:6, marginTop:6, color:P.lose, fontFamily:F.mono, fontSize:12, display:"flex", alignItems:"center", gap:6 } },
              React.createElement("span", null, "\u2713"), React.createElement("span", null, searchResult.user.displayName + (searchResult.experience ? " (LVL " + searchResult.experience.level + ")" : ""))
            )
          ),
          (compareALoading || searchLoading) && React.createElement(EVA.Spinner),
          compareA && compareA.user && searchResult && searchResult.user && React.createElement(EVA.CompareView, { a:compareA, b:searchResult }),
          (!compareA || !searchResult) && !compareALoading && !searchLoading && React.createElement(EVA.Empty, { text:"Sélectionnez les deux joueurs ci-dessus" })
        ),

        tab === "look4pvp" && React.createElement(EVA.Look4PVPView)
      ),

      // Mobile Tab bar
      React.createElement("div", { className:"app-tabbar", style: {
        position:"fixed", bottom:0, left:0, right:0, background:P.surface, borderTop:"1px solid "+P.border,
        justifyContent:"center", padding:"4px 0 max(4px, env(safe-area-inset-bottom))", zIndex:100
      }},
        React.createElement("div", { style: { display:"flex", maxWidth:480, width:"100%", justifyContent:"space-around", margin:"0 auto" } },
          TABS.map(function(t) {
            var active = tab === t.id;
            return React.createElement("button", {
              key:t.id, onClick: function() { setTab(t.id); if(t.id==="friends") setSubTab("list"); },
              style: { background:"none", border:"none", padding:"5px 8px", display:"flex", flexDirection:"column", alignItems:"center", gap:1, opacity:active?1:0.5, transition:"all 0.2s" }
            },
              React.createElement("img", {
                src:t.listImg,
                style: { width:48, height:48, objectFit:"contain",
                  filter: active ? "drop-shadow(0 0 4px rgba(0,229,255,0.4))" : "grayscale(0.5) opacity(0.5)",
                  transition:"all 0.2s" }
              }),
              active && React.createElement("div", { style: { width:16, height:2, borderRadius:1, background:P.accent, marginTop:2, boxShadow:"0 0 6px "+P.accentGlow } })
            );
          })
        )
      )

    ) // close main column
  ); // close app-shell
}

ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));