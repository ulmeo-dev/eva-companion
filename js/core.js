// ═══════════════════════════════════════════════
//  EVA Companion - Core Module
//  API, cache, queue, helpers, palette, shared components
// ═══════════════════════════════════════════════

var EVA = window.EVA = {};

// ── API ──
var EVA_API = "https://green-salad-fcd5.ulmeo.workers.dev/";

var _queue = [];
var _processing = false;

function _processQueue() {
  if (_processing || _queue.length === 0) return;
  _processing = true;
  var item = _queue.shift();
  _doFetch(item.body, item.resolve, item.reject, 0);
}

function _doFetch(body, resolve, reject, attempt) {
  fetch(EVA_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify(body),
  }).then(function(res) {
    if (res.status === 429) {
      if (attempt < 3) {
        setTimeout(function() { _doFetch(body, resolve, reject, attempt + 1); }, 3000 * (attempt + 1));
        return;
      }
      reject(new Error("RATE_LIMITED"));
      _processing = false;
      setTimeout(_processQueue, 5000);
      return;
    }
    if (!res.ok) { reject(new Error("HTTP " + res.status)); _processing = false; setTimeout(_processQueue, 100); return; }
    res.json().then(function(json) {
      if (json.errors && json.errors[0]) {
        var code = json.errors[0].extensions && json.errors[0].extensions.code;
        if (code === "TOO_MANY_REQUESTS") {
          if (attempt < 3) {
            setTimeout(function() { _doFetch(body, resolve, reject, attempt + 1); }, 3000 * (attempt + 1));
            return;
          }
          reject(new Error("RATE_LIMITED"));
          _processing = false;
          setTimeout(_processQueue, 5000);
          return;
        }
      }
      if (json.error) { reject(new Error(json.error)); }
      else { resolve(json); }
      setTimeout(function() { _processing = false; _processQueue(); }, 100);
    });
  }).catch(function(e) {
    reject(e);
    _processing = false;
    setTimeout(_processQueue, 100);
  });
}

function evaFetch(body) {
  return new Promise(function(resolve, reject) {
    _queue.push({ body: body, resolve: resolve, reject: reject });
    _processQueue();
  });
}

EVA.clearFetchQueue = function() {
  _queue.forEach(function(item) { item.reject(new Error("CANCELLED")); });
  _queue = [];
};

// ── GraphQL Queries ──
var SEASONS_QUERY = 'query listSeasons { listSeasons { nodes { id from to seasonNumber active status name } itemCount } }';

var PROFILE_QUERY = 'query getPublicPlayerByUsername($username: String!, $seasonId: Int, $includeStatistics: Boolean = false) { getPublicPlayerByUsername(username: $username) { id user { id username displayName } authorization { actions } seasonPass { active } experience(seasonId: $seasonId) { experience experienceForCurrentLevel experienceForNextLevel level levelProgressionPercentage seasonId authorization { actions } } ...PlayerStatisticsField @include(if: $includeStatistics) } } fragment PlayerStatisticsField on Player { statistics(seasonId: $seasonId) { gameId userId seasonId data { gameCount gameTime gameVictoryCount gameDefeatCount gameDrawCount inflictedDamage bestInflictedDamage kills deaths assists killDeathRatio killsByDeaths traveledDistance traveledDistanceAverage bestKillStreak } } }';

var HISTORY_QUERY = 'query useAfterhGameHistoryPageLastOnly($userId: Int!, $seasonId: Int!) { listLastAfterhGameHistoriesByUserAndSeason(userId: $userId, seasonId: $seasonId) { id createdAt data { duration outcome waveCount success generatorPercent puzzleFailedCount plasmaHitCount teamOne { score name } teamTwo { score name } round floor } players { id userId data { niceName rank team score outcome kills deaths assists inflictedDamage firedAccuracy totalKills } } terrain { id name location { id name department identifier country language status } } map { id name identifier maxPlayerCount isNew imageUrl backgroundImageUrl minimapImageUrl modeList { id identifier category } } mode { id identifier category } } }';

EVA.fetchSeasons = async function() {
  var json = await evaFetch({ operationName: "listSeasons", query: SEASONS_QUERY, variables: {} });
  return json.data && json.data.listSeasons ? json.data.listSeasons.nodes : [];
};

EVA.fetchProfile = async function(username, seasonId) {
  var json = await evaFetch({
    operationName: "getPublicPlayerByUsername",
    query: PROFILE_QUERY,
    variables: { username: username, seasonId: seasonId, includeStatistics: true },
  });
  if (json.errors) throw new Error(json.errors[0] ? json.errors[0].message : "GraphQL error");
  return json.data ? json.data.getPublicPlayerByUsername : null;
};

EVA.fetchHistory = async function(userId, seasonId) {
  var json = await evaFetch({
    operationName: "useAfterhGameHistoryPageLastOnly",
    query: HISTORY_QUERY,
    variables: { userId: userId, seasonId: seasonId },
  });
  return json.data ? json.data.listLastAfterhGameHistoriesByUserAndSeason : [];
};

var LOCATIONS_QUERY = 'query listLocations($country: CountryEnum!, $sortOrder: SortOrderLocationsInput) { listLocations(country: $country, sortOrder: $sortOrder) { id identifier name department telephone emailContact country language status iconUrl } }';

var _locationsCache = null;
EVA.fetchLocations = async function() {
  if (_locationsCache) return _locationsCache;
  var json = await evaFetch({
    operationName: "listLocations",
    query: LOCATIONS_QUERY,
    variables: { country: "FR", sortOrder: { by: "DEPARTMENT" } },
  });
  var list = json.data ? json.data.listLocations : [];
  if (list.length > 0) _locationsCache = list;
  return list;
};

var LOCATION_DETAIL_QUERY = 'query getLocationById($id: Int!, $includeDetails: Boolean = false, $includeMedias: Boolean = false, $includeMenu: Boolean = false, $includeNextOpeningDays: Boolean = false) { location(id: $id) { id identifier name department telephone emailContact country language status fullAddress addressMapsUrl geolocationPoint services { type } } }';

var _locationDetailCache = {};
EVA.fetchLocationDetail = async function(locationId) {
  if (_locationDetailCache[locationId]) return _locationDetailCache[locationId];
  var json = await evaFetch({
    operationName: "getLocationById",
    query: LOCATION_DETAIL_QUERY,
    variables: { id: locationId, includeDetails: false, includeMedias: false, includeMenu: false, includeNextOpeningDays: false },
  });
  var loc = json.data ? json.data.location : null;
  if (loc) _locationDetailCache[locationId] = loc;
  return loc;
};

var SESSIONS_QUERY = 'query useSessions($data: ListLocationSessionsByDateInput!, $country: CountryEnum!) { listLocationGameSessionsByDate(data: $data) { takenSeatCount totalSeatCount availableSeatCount unitPrice regularUnitPrice pricingType matchmakingLevel slot { id startTime duration } terrain { id displayNumber } game { id identifier name imageUrl } competitiveMode { isActive isAvailable } alreadyBooked } }';

EVA.fetchSessions = async function(locationId, date) {
  var json = await evaFetch({
    operationName: "useSessions",
    query: SESSIONS_QUERY,
    variables: {
      country: "FR",
      data: { date: date, isCompetitiveModeOnly: false, locationId: locationId, seatCount: 1, seatTypes: ["PLAYER"], gameIdList: [1] }
    },
  });
  return json.data ? json.data.listLocationGameSessionsByDate : [];
};

// ── Data Cache ──
var _dataCache = {};
EVA._activeSeasonId = null;

function cacheKey(type, id, sid) { return type + ":" + String(id).toLowerCase() + ":" + sid; }

function isSeasonCacheable(sid) {
  return EVA._activeSeasonId !== null && sid !== EVA._activeSeasonId;
}

EVA.cachedFetchProfile = async function(username, seasonId) {
  var key = cacheKey("profile", username, seasonId);
  if (isSeasonCacheable(seasonId) && _dataCache[key]) return _dataCache[key];
  var result = await EVA.fetchProfile(username, seasonId);
  if (result && isSeasonCacheable(seasonId)) _dataCache[key] = result;
  return result;
};

EVA.cachedFetchHistory = async function(userId, seasonId) {
  var key = cacheKey("history", userId, seasonId);
  if (isSeasonCacheable(seasonId) && _dataCache[key]) return _dataCache[key];
  var result = await EVA.fetchHistory(userId, seasonId);
  if (result && isSeasonCacheable(seasonId)) _dataCache[key] = result;
  return result;
};

// ── Storage ──
EVA.loadFriends = function() {
  try { return JSON.parse(localStorage.getItem("eva-companion-friends") || "[]"); }
  catch(e) { return []; }
};
EVA.saveFriends = function(list) { localStorage.setItem("eva-companion-friends", JSON.stringify(list)); };
EVA.loadMyTag = function() { return localStorage.getItem("eva-companion-mytag") || ""; };
EVA.saveMyTag = function(tag) { localStorage.setItem("eva-companion-mytag", tag); };

// ── Palette & Fonts ──
EVA.P = {
  bg: "#0a0a0f", surface: "#12121a", surfaceLight: "#1a1a26", surfaceHover: "#22222f",
  accent: "#00e5ff", accentDim: "#00e5ff22", accentGlow: "#00e5ff55",
  win: "#00e676", winDim: "#00e67622", lose: "#ff5252", loseDim: "#ff525222",
  gold: "#ffd740", goldDim: "#ffd74022",
  text: "#e8e8f0", textSec: "#8888a0", textDim: "#555570", border: "#2a2a3a",
};
EVA.F = { main: "'Rajdhani', sans-serif", mono: "'Share Tech Mono', monospace", title: "'Orbitron', sans-serif" };

// ── Helpers ──
EVA.fmtTime = function(s) {
  var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h > 0 ? h + "h" + String(m).padStart(2,"0") : m + "min";
};
EVA.fmtDT = function(iso) {
  var d = new Date(iso);
  return d.toLocaleDateString("fr-FR",{day:"2-digit",month:"2-digit"})+" "+d.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"});
};
EVA.fmtDist = function(m) { return m >= 1000 ? (m/1000).toFixed(1)+" km" : Math.round(m)+" m"; };
EVA.wr = function(v,t) { return t ? ((v/t)*100).toFixed(1) : "0"; };
EVA.n = function(v) { return v == null ? 0 : v; };
EVA.nf = function(v, d) { return v == null ? "0" : v.toFixed(d); };

EVA.seasonLabel = function(s) {
  if (!s) return "";
  var num = "Saison " + s.seasonNumber;
  if (s.name && s.name.length > 0) num = "S" + s.seasonNumber + " " + s.name.charAt(0).toUpperCase() + s.name.slice(1);
  if (s.active) num += " (active)";
  return num;
};

EVA.seasonShort = function(s) {
  if (!s) return "";
  if (s.name && s.name.length > 0) return "S" + s.seasonNumber + " " + s.name.charAt(0).toUpperCase() + s.name.slice(1);
  return "S" + s.seasonNumber;
};

// ── Safe fetch wrappers ──
EVA.safeFetchProfile = async function(tag, sid) {
  if (!tag || !sid) return null;
  try {
    var p = await EVA.cachedFetchProfile(tag, sid);
    return p && p.user ? p : null;
  } catch(e) {
    if (e.message === "RATE_LIMITED" || e.message === "CANCELLED") throw e;
    console.error("fetchProfile error for " + tag, e);
    return null;
  }
};

EVA.safeFetchHistory = async function(userId, sid) {
  if (!userId || !sid) return [];
  try { return await EVA.cachedFetchHistory(userId, sid) || []; }
  catch(e) { return []; }
};

// ── Shared Components (available via EVA.Spinner, EVA.Empty, etc.) ──
EVA.Spinner = function() {
  var P = EVA.P;
  return React.createElement("div", { style: { display:"flex", justifyContent:"center", padding: 60 } },
    React.createElement("div", { style: {
      width:36, height:36, border:"3px solid "+P.border, borderTopColor:P.accent,
      borderRadius:"50%", animation:"spin 0.8s linear infinite"
    }})
  );
};

EVA.Empty = function(props) {
  return React.createElement("div", { style: {
    padding:40, textAlign:"center", color:EVA.P.textDim, fontFamily:EVA.F.mono, fontSize:13
  }}, props.text);
};

EVA.SeasonSelector = function(props) {
  var seasons = props.seasons, selectedId = props.selectedId, onChange = props.onChange;
  var P = EVA.P, F = EVA.F;
  if (!seasons || seasons.length === 0) return null;
  return React.createElement("div", { style: { display:"flex", gap:8, marginBottom:14, alignItems:"center" } },
    React.createElement("select", {
      value: selectedId || "",
      onChange: function(e) { onChange(parseInt(e.target.value)); },
      style: {
        padding:"6px 12px", borderRadius:8, fontSize:13, fontFamily:F.mono, fontWeight:600,
        background:P.surfaceLight, border:"1px solid "+P.border, color:P.accent,
        appearance:"none", WebkitAppearance:"none", MozAppearance:"none",
        backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2300e5ff' d='M2 4l4 4 4-4'/%3E%3C/svg%3E\")",
        backgroundRepeat:"no-repeat", backgroundPosition:"right 10px center",
        paddingRight:30, minWidth:160, cursor:"pointer"
      }
    },
      seasons.slice().reverse().map(function(s) {
        return React.createElement("option", { key: s.id, value: s.id, style: { background:P.surface, color:P.text } }, EVA.seasonLabel(s));
      })
    )
  );
};

// ── Tab icon component with blur effect ──
EVA.TabIcon = function(props) {
  var src = props.src, size = props.size || 28, active = props.active;
  return React.createElement("img", {
    src: src,
    style: {
      width: size, height: size, objectFit: "contain",
      filter: active ? "drop-shadow(0 0 6px rgba(0,229,255,0.4))" : "grayscale(0.5) opacity(0.6)",
      maskImage: "radial-gradient(ellipse 80% 80% at center, black 50%, transparent 75%)",
      WebkitMaskImage: "radial-gradient(ellipse 80% 80% at center, black 50%, transparent 75%)",
      transition: "all 0.2s"
    }
  });
};

// ── Tab definitions ──
EVA.TABS = [
  { id:"profile", label:"Profil", listImg:"data/profil-list.png", menuImg:"data/profil-menu.png" },
  { id:"friends", label:"Amis", listImg:"data/friends-list.png", menuImg:"data/friends-menu.png" },
  { id:"compare", label:"VS", listImg:"data/compare-list.png", menuImg:"data/compare-menu.png" },
  { id:"look4pvp", label:"Salle", listImg:"data/look4pvp-list.png", menuImg:"data/look4pvp-menu.png" },
];