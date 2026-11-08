const REGIONS = [
    { id: "kanto",  name: "Kanto",  start: "Lavender",  maxScale: 10, minScale: 0.7, tiles: "kanto",  w: 7511,  h: 6400 },
    { id: "johto",  name: "Johto",  start: "Ecruteak",  maxScale: 12, minScale: 0.6, tiles: "johto",  w: 8660,  h: 5730 },
    { id: "hoenn",  name: "Hoenn",  start: "Fallarbor", maxScale: 20, minScale: 0.7, tiles: "hoenn",  w: 13024, h: 6864 },
    { id: "sinnoh", name: "Sinnoh", start: "Solaceon",  maxScale: 20, minScale: 0.7, tiles: "sinnoh", w: 13793, h: 8360 },
    { id: "unova",  name: "Unova",  start: "Driftveil", maxScale: 12, minScale: 0.6, tiles: "unova",  w: 9029,  h: 5905 }
];

const MAP_TILE = 1024;
const MAP_PREVIEW_SCALE = 4;
const REGION_BY_ID = Object.fromEntries(REGIONS.map(r => [r.id, r]));

const TOTAL_CATS = 30;
const CATS_PER_REGION = 6;
const FINAL_HINT = "presence";
const MARKER_PX = 34;
const STORAGE_KEY = "pumpcat-finder-v1";

const HINT_LIST = typeof hint_list !== "undefined" && Array.isArray(hint_list) ? hint_list : [];
const HINT_BY_KEY = Object.fromEntries(HINT_LIST.map(x => [x.key, x]));

const HINT_ALIASES = { precense: "presence" };
const CITY_ALIASES = {
    canavale:   "canalave",
    vermiliom:  "vermilion",
    fuschia:    "fuchsia",
    padifidlog: "pacifidlog",
    fallabor:   "fallarbor"
};

const CITY_LIST = typeof city_list !== "undefined" && Array.isArray(city_list) ? city_list : [];
const CITY_BY_KEY = Object.fromEntries(CITY_LIST.map(c => [c.key, c]));

const $ = id => document.getElementById(id);

function h(tag, attrs = {}, ...children) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
        if (v == null || v === false) continue;
        if (k === "class") el.className = v;
        else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
        else if (k === "html") el.innerHTML = v;
        else el.setAttribute(k, v === true ? "" : v);
    }
    for (const c of children.flat()) {
        if (c == null || c === false) continue;
        el.append(c instanceof Node ? c : document.createTextNode(String(c)));
    }
    return el;
}

function prettify(key) {
    return String(key)
        .replace(/[-_]+/g, " ")
        .replace(/\b\w/g, c => c.toUpperCase());
}

const normHint = hint => HINT_ALIASES[hint] || hint;
const normCity = city => CITY_ALIASES[city] || city;
// Texto visible según el idioma elegido (src/i18n.js)
const localized = obj => obj && (obj[LANG] || obj.en || obj.es || obj.name);
const hintLabel = hint => localized(HINT_BY_KEY[hint]) || prettify(hint);
const cityName = key => localized(CITY_BY_KEY[normCity(key)]) || key || t("no_city");
const regionName = id => (REGION_BY_ID[id] ? t(`region_${id}`) : id);

function getDriveImageUrl(url) {
    if (!url) return "";
    const m = url.match(/\/file\/d\/([^/?]+)/) || url.match(/[?&]id=([^&]+)/);
    return m ? `https://drive.google.com/thumbnail?id=${m[1]}&sz=w1600` : url;
}

let state = {
    region: "kanto",
    hint: "empty",
    found: [],
    checked: []
};

function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) state = { ...state, ...JSON.parse(raw) };
    } catch (e) {}
    if (!REGION_BY_ID[state.region]) state.region = "kanto";
}

function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { }
}

loadState();
let currentRegion = state.region;
let checkedSet = new Set(state.checked);

function commit() {
    syncRegionLock();
    state.region = currentRegion;
    state.checked = [...checkedSet];
    saveState();
    render();
}

const mapContainer = $("map-container");
const maps = Object.fromEntries(REGIONS.map(r => [r.id, $(`map-${r.id}`)]));
const markerLayer = $("pf-markers");
const panzooms = {};
const SVG_NS = "http://www.w3.org/2000/svg";

const mapLayers = {};

for (const r of REGIONS) {
    const svg = maps[r.id];
    svg.replaceChildren();
    const base = `./img/tiles/${r.tiles}`;

    const preview = document.createElementNS(SVG_NS, "image");
    preview.setAttribute("width", r.w);
    preview.setAttribute("height", r.h);
    preview.setAttribute("preserveAspectRatio", "none");
    preview.classList.add("pf-map-img");
    svg.appendChild(preview);

    const group = document.createElementNS(SVG_NS, "g");
    svg.appendChild(group);

    const tiles = [];
    for (let y = 0, row = 0; y < r.h; y += MAP_TILE, row++) {
        for (let x = 0, col = 0; x < r.w; x += MAP_TILE, col++) {
            const w = Math.min(MAP_TILE, r.w - x), h = Math.min(MAP_TILE, r.h - y);
            const el = document.createElementNS(SVG_NS, "image");
            el.setAttribute("x", x);
            el.setAttribute("y", y);
            el.setAttribute("width", w);
            el.setAttribute("height", h);
            el.setAttribute("preserveAspectRatio", "none");
            el.classList.add("pf-map-img");
            group.appendChild(el);
            tiles.push({ el, x, y, w, h, src: `${base}/${col}_${row}.webp`, loaded: false });
        }
    }
    mapLayers[r.id] = { preview, previewSrc: `${base}/preview.webp`, previewLoaded: false, tiles };
}

function unloadRegionImages(keep) {
    for (const [id, layer] of Object.entries(mapLayers)) {
        if (id === keep) continue;
        if (layer.previewLoaded) { layer.preview.removeAttribute("href"); layer.previewLoaded = false; }
        for (const t of layer.tiles) {
            if (t.loaded) { t.el.removeAttribute("href"); t.loaded = false; }
        }
    }
}

function updateTiles() {
    const layer = mapLayers[currentRegion];
    const svg = maps[currentRegion];
    if (!layer.previewLoaded) {
        layer.preview.setAttribute("href", layer.previewSrc);
        layer.previewLoaded = true;
    }
    const ctm = svg.getScreenCTM();
    if (!ctm || !ctm.a) return;
    const unitsPerPx = 1 / ctm.a;
    const needFull = unitsPerPx < MAP_PREVIEW_SCALE * 0.9;

    const c = mapContainer.getBoundingClientRect();
    const inv = ctm.inverse();
    const x0 = inv.a * c.left + inv.c * c.top + inv.e;
    const y0 = inv.b * c.left + inv.d * c.top + inv.f;
    const x1 = inv.a * c.right + inv.c * c.bottom + inv.e;
    const y1 = inv.b * c.right + inv.d * c.bottom + inv.f;
    const loadPad = MAP_TILE * 0.25, keepPad = MAP_TILE * 1.5;

    for (const t of layer.tiles) {
        const inside = pad => t.x < x1 + pad && t.x + t.w > x0 - pad && t.y < y1 + pad && t.y + t.h > y0 - pad;
        if (needFull && inside(loadPad)) {
            if (!t.loaded) { t.el.setAttribute("href", t.src); t.loaded = true; }
        } else if (t.loaded && (!needFull || !inside(keepPad))) {
            t.el.removeAttribute("href");
            t.loaded = false;
        }
    }
}

let pzManualBind = true;
for (const r of REGIONS) {
    const svg = maps[r.id];
    let pz = Panzoom(svg, { maxScale: r.maxScale, minScale: r.minScale, noBind: true });
    if (typeof pz.handleDown !== "function") {
        if (pz.destroy) pz.destroy();
        pz = Panzoom(svg, { maxScale: r.maxScale, minScale: r.minScale });
        pzManualBind = false;
    }
    panzooms[r.id] = pz;
    svg.addEventListener("panzoomchange", () => { if (r.id === currentRegion) scheduleMapUpdate(); });
    svg.addEventListener("panzoomstart", hidePopover);
}

if (pzManualBind) {
    mapContainer.addEventListener("pointerdown", e => {
        if (e.target.closest(".pf-map-ui")) return;
        panzooms[currentRegion].handleDown(e);
    });
    document.addEventListener("pointermove", e => panzooms[currentRegion].handleMove(e));
    document.addEventListener("pointerup", e => panzooms[currentRegion].handleUp(e));
    document.addEventListener("pointercancel", e => panzooms[currentRegion].handleUp(e));
}

mapContainer.addEventListener("wheel", e => {
    panzooms[currentRegion].zoomWithWheel(e);
    hidePopover();
}, { passive: false });

let mapUpdateQueued = false;
function scheduleMapUpdate() {
    if (mapUpdateQueued) return;
    mapUpdateQueued = true;
    requestAnimationFrame(() => {
        mapUpdateQueued = false;
        positionMarkers();
        updateTiles();
    });
}
const updateCatSizes = scheduleMapUpdate;

window.addEventListener("resize", scheduleMapUpdate);

let markers = [];
const HINT_ORDER = HINT_LIST.map(x => x.key);
let pointerDownInfo = null;

function buildMarkers() {
    markers.forEach(m => m.el.remove());

    markers = cat_list.map((cat, i) => {
        const cityKey = normCity(cat.city);
        return {
            i,
            cat,
            key: `${cat.region}|${cat.x}|${cat.y}`,
            region: cat.region,
            cityKey,
            get name() { return cityName(cityKey); },
            hints: [...new Set(String(cat.hint || "").split("|").map(s => normHint(s.trim())).filter(Boolean))],
            image: cat.image || "",
            x: Number(cat.x),
            y: Number(cat.y),
            el: null
        };
    });

    const seen = {}, totals = {};
    markers.forEach(m => { const k = m.region + m.cityKey; totals[k] = (totals[k] || 0) + 1; });
    markers.forEach(m => {
        const k = m.region + m.cityKey;
        seen[k] = (seen[k] || 0) + 1;
        m.spot = totals[k] > 1 ? seen[k] : 0;
    });

    markers.forEach(m => m.hints.forEach(hk => { if (!HINT_ORDER.includes(hk)) HINT_ORDER.push(hk); }));

    for (const m of markers) {
        const el = document.createElement("img");
        el.src = "./img/cat.png";
        el.alt = "";
        el.draggable = false;
        el.className = "cat-marker";
        el.dataset.index = m.i;
        m.el = el;
        markerLayer.appendChild(el);

        el.addEventListener("mouseenter", () => showCatTooltip(m));
        el.addEventListener("mouseleave", hideCatTooltip);
        el.addEventListener("pointerdown", e => {
            pointerDownInfo = { m, x: e.clientX, y: e.clientY };
        });
    }
}

document.addEventListener("pointerup", e => {
    const info = pointerDownInfo;
    pointerDownInfo = null;
    if (!info) return;
    if (Math.hypot(e.clientX - info.x, e.clientY - info.y) > 6) return;
    openPopover(info.m, e.clientX, e.clientY);
});

function mapToScreen(region, x, y) {
    const ctm = maps[region].getScreenCTM();
    const c = mapContainer.getBoundingClientRect();
    if (!ctm) return null;
    return {
        x: ctm.a * x + ctm.c * y + ctm.e - c.left,
        y: ctm.b * x + ctm.d * y + ctm.f - c.top,
        w: c.width, h: c.height
    };
}

function positionMarkers() {
    const ctm = maps[currentRegion].getScreenCTM();
    if (!ctm) return;
    const c = mapContainer.getBoundingClientRect();
    const half = MARKER_PX / 2;
    for (const m of markers) {
        const here = m.region === currentRegion;
        m.el.classList.toggle("other-region", !here);
        if (!here) continue;
        const sx = ctm.a * m.x + ctm.c * m.y + ctm.e - c.left;
        const sy = ctm.b * m.x + ctm.d * m.y + ctm.f - c.top;
        const off = sx < -MARKER_PX || sy < -MARKER_PX || sx > c.width + MARKER_PX || sy > c.height + MARKER_PX;
        m.el.classList.toggle("offscreen", off);
        if (!off) m.el.style.transform = `translate3d(${Math.round(sx - half)}px, ${Math.round(sy - half)}px, 0)`;
    }
}

const isChecked = m => checkedSet.has(m.key);
const foundIndexOf = m => state.found.findIndex(f => f.region === m.region && f.city === m.cityKey);
const isFoundCity = m => foundIndexOf(m) !== -1;
const isOpen = m => !isChecked(m) && !isFoundCity(m);
const foundInRegion = region => state.found.filter(f => f.region === region).length;
const regionHasData = region => markers.some(m => m.region === region);

function candidatesFor(region, hint) {
    if (!hint || hint === "empty") return [];
    return markers.filter(m => m.region === region && m.hints.includes(hint));
}
const candidates = () => candidatesFor(currentRegion, state.hint);

const openCountFor = (region, hint) => candidatesFor(region, hint).filter(m => !isFoundCity(m)).length;


function allowedRegions() {
    const f = state.found;
    const n = f.length;
    const all = REGIONS.map(r => r.id);
    if (n === 0) return all;
    if (n >= TOTAL_CATS) return [];
    const start = f[0].region;
    if (n === TOTAL_CATS - 1) return [start];

    const last = f[n - 1].region;
    let run = 0;
    for (let i = n - 1; i >= 0 && f[i].region === last; i--) run++;
    const quota = CATS_PER_REGION;
    if (run < quota) return [last];

    const visited = new Set(f.map(x => x.region));
    const next = all.filter(id => !visited.has(id));
    return next.length ? next : all;
}

function blockInfo() {
    const f = state.found;
    const n = f.length;
    if (!n) return null;
    const last = f[n - 1].region;
    let run = 0;
    for (let i = n - 1; i >= 0 && f[i].region === last; i--) run++;
    const quota = CATS_PER_REGION;
    return { region: last, run, quota };
}

// Gatos que tendrá cada región en total:
//   región inicial: 6 + el #30 (vuelve al final con la pista "presence") = 7
//   última región visitada: solo 5 (#25–#29), porque el total es 30
//   las demás: 6
function regionMax(id) {
    const f = state.found;
    if (!f.length) return CATS_PER_REGION;
    if (id === f[0].region) return CATS_PER_REGION + 1;
    const order = [];
    for (const x of f) if (!order.includes(x.region)) order.push(x.region);
    const last = REGIONS.length - 1;
    if (order.indexOf(id) === last) return CATS_PER_REGION - 1;
    if (order.length === last && !order.includes(id)) return CATS_PER_REGION - 1;
    return CATS_PER_REGION;
}

function syncRegionLock() {
    const allowed = allowedRegions();
    if (allowed.length === 1 && allowed[0] !== currentRegion) showRegion(allowed[0]);
}

function lockedMessage() {
    const allowed = allowedRegions();
    if (allowed.length === 1) {
        const n = state.found.length;
        if (n === TOTAL_CATS - 1) return t("locked_final", { region: regionName(allowed[0]) });
        const b = blockInfo();
        return t("locked_stay", { region: regionName(allowed[0]), run: b.run, quota: b.quota });
    }
    return t("locked_new", { regions: allowed.map(regionName).join(", ") });
}

function toggleChecked(m) {
    if (isChecked(m)) {
        checkedSet.delete(m.key);
        commit();
    } else {
        checkedSet.add(m.key);
        commit();
        checkExhausted();
    }
}

function markFound(m) {
    state.found.push({ city: m.cityKey, region: m.region, hint: state.hint, key: m.key });
    checkedSet.clear();
    hidePopover();
    commit();
    openFoundDialog(m);
}

function removeFound(index) {
    state.found.splice(index, 1);
    commit();
}

function setHint(hint) {
    state.hint = hint;
    commit();
    checkExhausted();
}

function showRegion(region) {
    currentRegion = region;
    for (const [id, svg] of Object.entries(maps)) {
        svg.classList.toggle("selected-map", id === region);
        svg.classList.toggle("hidden-map", id !== region);
    }
    unloadRegionImages(region);
    hidePopover();
    scheduleMapUpdate();
}

function changeRegion(region, force = false) {
    if (!maps[region]) return;
    if (!force && !allowedRegions().includes(region)) {
        toast(lockedMessage());
        return;
    }
    showRegion(region);
    commit();
}

function checkExhausted() {
    const cands = candidates();
    if (!cands.length || cands.some(isOpen)) return;

    const vars = { region: regionName(currentRegion), hint: `"${hintLabel(state.hint)}"` };
    const manual = cands.filter(isChecked);
    const text = $("pf-empty-text");

    if (manual.length) {
        manual.forEach(m => checkedSet.delete(m.key));
        commit();
        text.replaceChildren(...tRich("empty_manual", { ...vars, n: manual.length }));
    } else {
        text.replaceChildren(...tRich("empty_found", vars));
    }
    $("pf-empty-dialog").showModal();
}


function render() {
    renderMarkers();
    renderRegionTabs();
    renderHintSelect();
    renderCandidates();
    renderLog();
    renderProgress();
}

function renderMarkers() {
    const hint = state.hint;
    for (const m of markers) {
        const visible = hint === "empty" || m.hints.includes(hint);
        m.el.classList.toggle("filtered", !visible);
        m.el.classList.toggle("found", isFoundCity(m));
        m.el.classList.toggle("checked", !isFoundCity(m) && isChecked(m));
    }
}

function renderRegionTabs() {
    const nav = $("pf-regions");
    const allowed = allowedRegions();
    nav.replaceChildren(...REGIONS.map(r => {
        const n = foundInRegion(r.id);
        const locked = !allowed.includes(r.id);
        const cls = ["pf-region-btn",
            r.id === currentRegion && "active",
            n >= regionMax(r.id) && "done",
            locked && "locked",
            !regionHasData(r.id) && "empty-data"].filter(Boolean).join(" ");
        return h("button", {
            class: cls, "data-region": r.id,
            title: locked ? lockedMessage() : t("starts_in", { city: cityName(r.start.toLowerCase()) }),
            onclick: () => changeRegion(r.id)
        }, "", regionName(r.id), h("span", { class: "pf-count", }, `${n}/${regionMax(r.id)}`));
    }));
    $("pf-region-pill").textContent = regionName(currentRegion);
    const active = nav.querySelector(".active");
    if (active && nav.scrollWidth > nav.clientWidth) {
        nav.scrollLeft = active.offsetLeft - nav.clientWidth / 2 + active.offsetWidth / 2;
    }
}

function renderHintSelect() {
    const select = $("current-hint");
    select.replaceChildren(
        h("option", { value: "empty" }, t("select_hint")),
        ...HINT_ORDER.map(hk => {
            const n = openCountFor(currentRegion, hk);
            return h("option", { value: hk }, `${hintLabel(hk)}  (${n})`);
        })
    );
    select.value = state.hint;
}

function renderCandidates() {
    const list = $("pf-candidates");
    const countPill = $("pf-candidates-count");
    const region = regionName(currentRegion);

    if (state.hint === "empty") {
        countPill.textContent = "–";
        list.replaceChildren(h("li", { class: "pf-list-empty" }, t("cand_pick_hint", { region })));
        return;
    }

    const cands = candidates();
    const open = cands.filter(isOpen);
    countPill.textContent = String(open.length);

    if (!cands.length) {
        list.replaceChildren(h("li", { class: "pf-list-empty" },
            regionHasData(currentRegion)
                ? t("cand_none", { region })
                : t("cand_no_data", { region })));
        return;
    }

    const rank = m => isFoundCity(m) ? 2 : isChecked(m) ? 1 : 0;
    cands.sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name) || a.spot - b.spot);

    list.replaceChildren(...cands.map(m => {
        const found = isFoundCity(m);
        const checked = !found && isChecked(m);
        const li = h("li", {
                class: `pf-cand${found ? " is-found" : ""}${checked ? " is-checked" : ""}`,
                onmouseenter: () => m.el.classList.add("pulse"),
                onmouseleave: () => m.el.classList.remove("pulse")
            },
            h("button", { class: "pf-cand-name", title: t("view_on_map"), onclick: () => focusMarker(m) },
                m.name, m.spot ? h("small", {}, t("spot", { n: m.spot })) : null)
        );
        if (found) {
        } else {
            li.append(
                checked
                    ? h("button", { class: "pf-act pf-act-undo", title: t("uncheck"), onclick: () => toggleChecked(m) }, "↺")
                    : h("button", { class: "pf-act pf-act-no", title: t("checked_no"), onclick: () => toggleChecked(m) }, "✗"),
                h("button", { class: "pf-act pf-act-yes", title: t("found_here"), onclick: () => markFound(m) }, "✓")
            );
        }
        return li;
    }));
}

function renderLog() {
    $("pf-region-progress").replaceChildren(...REGIONS.map(r => {
        const n = foundInRegion(r.id);
        return h("div", {
            class: `pf-rp${r.id === currentRegion ? " current" : ""}${n >= regionMax(r.id) ? " done" : ""}`
        }, h("b", {}, `${n}/${regionMax(r.id)}`), regionName(r.id));
    }));
    const log = $("cat-table");
    const items = [];
    for (let idx = 0; idx < TOTAL_CATS; idx++) {
        const f = state.found[idx];
        if (!f) {
            const isNext = idx === state.found.length;
            if (isNext) { items.push(manualEntrySlot(idx)); continue; }
            items.push(h("li", {
                class: `cat-node pf-slot-empty${isNext ? " pf-slot-next" : ""}`,
                title: isNext
                    ? (idx === TOTAL_CATS - 1
                        ? t("slot_final", { n: idx + 1 })
                        : t("slot_searching", { n: idx + 1, region: regionName(currentRegion) }))
                    : `#${idx + 1}`
            }, "????????????"));
            continue;
        }
        const name = cityName(f.city);
        const hintText = f.manual ? t("log_manual") : f.hint && f.hint !== "empty" ? hintLabel(f.hint) : t("log_no_hint");
        items.push(h("li", {
                class: "cat-node pf-slot-found",
                title: `#${idx + 1} · ${name} (${regionName(f.region)}) · ${hintText}`
            },
            h("span", { class: "pf-slot-name" }, name),
            h("button", { class: "pf-log-del", title: t("log_delete"), onclick: () => removeFound(idx) }, "×")
        ));
    }
    log.replaceChildren(...items);
    if (focusManualInput) {
        focusManualInput = false;
        const inp = $("pf-manual-input");
        if (inp) inp.focus();
    }

    const tip = $("pf-log-tip");
    if (tip) tip.style.display = state.found.length ? "none" : "";
    $("pf-undo").disabled = !state.found.length;
}
let focusManualInput = false;

function manualEntrySlot(idx) {
    const opts = [...CITY_LIST].sort((a, b) =>
        (b.region === currentRegion) - (a.region === currentRegion) ||
        REGIONS.findIndex(r => r.id === a.region) - REGIONS.findIndex(r => r.id === b.region) ||
        cityName(a.key).localeCompare(cityName(b.key)));

    const input = h("input", {
        id: "pf-manual-input",
        class: "pf-slot-input",
        type: "text",
        list: "pf-city-options",
        placeholder: t("add_city"),
        autocomplete: "off",
        onkeydown: e => { if (e.key === "Enter") { e.preventDefault(); addManualCity(input.value); } }
    });

    return h("li", {
            class: "cat-node pf-slot-next pf-slot-manual",
            title: idx === TOTAL_CATS - 1
                ? t("slot_final", { n: idx + 1 })
                : t("slot_manual", { n: idx + 1 })
        },
        input,
        h("datalist", { id: "pf-city-options" },
            ...opts.map(c => h("option", { value: cityName(c.key) }, regionName(c.region)))),
        h("button", { class: "pf-slot-add", title: t("add_to_log"), onclick: () => addManualCity(input.value) }, "+")
    );
}

function findCity(text) {
    const q = text.trim().toLowerCase();
    if (!q) return null;
    // Acepta el nombre en cualquier idioma o la clave
    const names = c => [c.key, c.en, c.es, c.name].filter(Boolean).map(x => String(x).toLowerCase());
    const matches = CITY_LIST.filter(c => names(c).includes(q));
    return matches.find(c => c.region === currentRegion) || matches[0] || null;
}

function addManualCity(text) {
    const value = text.trim();
    if (!value) return;
    if (state.found.length >= TOTAL_CATS) return;

    let city = findCity(value);
    if (!city) {
        if (!confirm(t("city_unknown_confirm", { city: value, region: regionName(currentRegion) }))) return;
        city = { key: value.toLowerCase(), region: currentRegion, en: value, es: value };
    }

    const allowed = allowedRegions();
    if (!allowed.includes(city.region)) {
        if (!confirm(t("city_locked_confirm", { locked: lockedMessage(), city: cityName(city.key) || value, region: regionName(city.region) }))) return;
    }

    state.found.push({ city: city.key, region: city.region, hint: "empty", key: `${city.region}|${city.key}`, manual: true });
    checkedSet.clear();
    focusManualInput = true;
    const next = allowedRegions();
    if (next.length === 1 || next.includes(city.region)) {
        showRegion(next.includes(city.region) ? city.region : next[0]);
    }
    commit();
    if (state.found.length === TOTAL_CATS - 1) setHint(FINAL_HINT);

    const n = state.found.length;
    const multi = allowedRegions().length > 1;
    const vars = { n, city: cityName(city.key) || value, region: regionName(currentRegion) };
    if (n >= TOTAL_CATS) openAbout(true);
    toast(n >= TOTAL_CATS ? t("toast_log_complete")
        : n === TOTAL_CATS - 1 ? t("toast_manual_final", vars)
        : multi ? t("toast_manual_region_done", vars)
        : city.region !== currentRegion ? t("toast_manual_moved", vars)
        : t("toast_manual_added", vars));
}

function renderProgress() {
    const n = state.found.length;
    $("pf-progress-count").textContent = n;
    $("pf-progress-fill").style.width = `${Math.min(100, (n / TOTAL_CATS) * 100)}%`;
}
function focusMarker(m) {
    if (m.region !== currentRegion) changeRegion(m.region);
    const pz = panzooms[m.region];
    const target = Math.max(pz.getScale(), REGION_BY_ID[m.region].maxScale * 0.3);
    pz.zoom(target, { animate: false });
    const p = mapToScreen(m.region, m.x, m.y);
    if (p) pz.pan((p.w / 2 - p.x) / pz.getScale(), (p.h / 2 - p.y) / pz.getScale(), { relative: true, animate: false });
    scheduleMapUpdate();
    m.el.classList.add("pulse");
    setTimeout(() => m.el.classList.remove("pulse"), 1600);
    if (window.innerWidth <= 900) $("side-panel").classList.remove("open");
}

$("pf-reset-view").addEventListener("click", () => {
    panzooms[currentRegion].reset({ animate: false });
    scheduleMapUpdate();
});
const catTooltip = h("div", { id: "cat-tooltip" });
document.body.appendChild(catTooltip);

function showCatTooltip(m) {
    if ($("pf-popover").classList.contains("open")) return;
    const stateText = isFoundCity(m) ? t("tt_found", { n: foundIndexOf(m) + 1 })
        : isChecked(m) ? t("tt_checked") : t("tt_click");
    catTooltip.replaceChildren(
        h("div", { class: "pf-tt-title" }, m.name, m.spot ? ` · ${t("spot", { n: m.spot })}` : ""),
        h("div", { class: "pf-tt-sub" }, m.hints.map(hintLabel).join(" · ")),
        h("div", { class: "pf-tt-state" }, stateText)
    );
    if (m.image) {
        catTooltip.append(h("img", {
            src: getDriveImageUrl(m.image), alt: m.name,
            class: "cat-tooltip-image", referrerpolicy: "no-referrer"
        }));
    }
    catTooltip.style.display = "block";
}

function hideCatTooltip() { catTooltip.style.display = "none"; }

document.addEventListener("mousemove", e => {
    if (catTooltip.style.display !== "block") return;
    const pad = 15;
    const w = catTooltip.offsetWidth, hgt = catTooltip.offsetHeight;
    let x = e.clientX + pad, y = e.clientY + pad;
    if (x + w > window.innerWidth - 8) x = e.clientX - w - pad;
    if (y + hgt > window.innerHeight - 8) y = e.clientY - hgt - pad;
    catTooltip.style.left = `${x}px`;
    catTooltip.style.top = `${y}px`;
});
const popover = $("pf-popover");

function openPopover(m, x, y) {
    hideCatTooltip();
    $("pf-pop-title").textContent = m.name + (m.spot ? ` · ${t("spot", { n: m.spot })}` : "");
    $("pf-pop-hints").textContent = m.hints.map(hintLabel).join(" · ");

    const actions = $("pf-pop-actions");
    if (isFoundCity(m)) {
        actions.replaceChildren(h("div", { class: "pf-muted pf-small" },
            t("pop_found_city", { n: foundIndexOf(m) + 1 })));
    } else {
        actions.replaceChildren(
            h("button", { class: "pf-pop-yes", onclick: () => markFound(m) }, t("pop_yes")),
            isChecked(m)
                ? h("button", { class: "pf-pop-undo", onclick: () => { toggleChecked(m); hidePopover(); } }, t("pop_undo"))
                : h("button", { class: "pf-pop-no", onclick: () => { hidePopover(); toggleChecked(m); } }, t("pop_no"))
        );
    }

    popover.classList.add("open");
    popover.setAttribute("aria-hidden", "false");
    const w = popover.offsetWidth, hgt = popover.offsetHeight;
    let left = x + 12, top = y + 12;
    if (left + w > window.innerWidth - 8) left = x - w - 12;
    if (top + hgt > window.innerHeight - 8) top = y - hgt - 12;
    popover.style.left = `${Math.max(8, left)}px`;
    popover.style.top = `${Math.max(8, top)}px`;
}

function hidePopover() {
    popover.classList.remove("open");
    popover.setAttribute("aria-hidden", "true");
}

document.addEventListener("pointerdown", e => {
    if (!popover.contains(e.target)) hidePopover();
});
document.addEventListener("keydown", e => { if (e.key === "Escape") hidePopover(); });
function openFoundDialog(m) {
    const total = state.found.length;
    const dialog = $("pf-found-dialog");

    if (total >= TOTAL_CATS) {
        toast(t("toast_all_found"));
        openAbout(true);
        return;
    }

    if (total === TOTAL_CATS - 1) {
        setHint(FINAL_HINT);
        toast(t("toast_found_final", { n: total, region: regionName(currentRegion), hint: hintLabel(FINAL_HINT) }));
        return;
    }

    const allowed = allowedRegions();
    if (allowed.includes(currentRegion)) {
        const vars = { n: total, city: m.name, region: regionName(currentRegion) };
        toast(m.region !== currentRegion ? t("toast_found_moved", vars) : t("toast_found", vars));
        return;
    }
    const inRegion = foundInRegion(m.region);
    $("pf-found-title").textContent = t("found_dialog_title", { n: total });
    $("pf-found-text").replaceChildren(
        t("found_dialog_text", { city: m.name, region: regionName(m.region), count: inRegion, max: regionMax(m.region) }), " ",
        h("b", {}, t("found_dialog_done"))
    );
    $("pf-found-regions").replaceChildren(...REGIONS.map(r => {
        const n = foundInRegion(r.id);
        return h("button", {
            type: "button",
            disabled: !allowed.includes(r.id),
            onclick: () => { dialog.close("region"); changeRegion(r.id); }
        }, regionName(r.id), " ", h("small", {}, `${n}/${regionMax(r.id)}`));
    }));
    dialog.returnValue = "";
    dialog.showModal();
}

// ---------- Agradecimientos ("Acerca de") ----------
const CREDIT_GROUPS =
    typeof credits_groups !== "undefined" && Array.isArray(credits_groups) ? credits_groups
    : typeof credits_list !== "undefined" && Array.isArray(credits_list) ? [{ people: credits_list }]
    : [];

function creditPerson(c) {
    const initial = () => h("span", { class: "pf-credit-photo pf-credit-initial", "aria-hidden": "true" },
        (String(c.name || "?").trim()[0] || "?").toUpperCase());
    const photo = c.image
        ? h("img", { class: "pf-credit-photo", src: c.image, alt: c.name, loading: "lazy" })
        : initial();
    if (c.image) photo.addEventListener("error", () => photo.replaceWith(initial()), { once: true });
    const name = h("span", { class: "pf-credit-name" }, c.name);
    return h("li", {},
        c.link
            ? h("a", { href: c.link, target: "_blank", rel: "noopener", class: "pf-credit" }, photo, name)
            : h("div", { class: "pf-credit" }, photo, name));
}

function renderCredits() {
    $("pf-credits").replaceChildren(...CREDIT_GROUPS.map(g => {
        const title = g.title && typeof g.title === "object" ? localized(g.title) : g.title;
        const level = g.style === "subtitle" ? "subtitle" : "title";
        return h("section", { class: `pf-credit-group pf-credit-${level}` },
            title ? h(level === "title" ? "h5" : "h6", { class: "pf-credit-heading" }, title) : null,
            h("ul", { class: "pf-credits-list" }, ...(g.people || []).map(creditPerson)));
    }));
}

function openAbout(finished = false) {
    hidePopover();
    hideCatTooltip();
    renderCredits();
    $("pf-about-congrats").hidden = !finished;
    const dlg = $("pf-about-dialog");
    if (!dlg.open) dlg.showModal();
}

$("pf-about-btn").addEventListener("click", () => openAbout(false));

let toastTimer = null;
function toast(msg) {
    const t = $("pf-toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
}

$("current-hint").addEventListener("change", e => setHint(e.target.value));

$("pf-undo").addEventListener("click", () => {
    if (!state.found.length) return;
    const last = state.found.pop();
    commit();
    const n = state.found.length + 1;
    toast(last.city ? t("toast_undo_city", { n, city: cityName(last.city) }) : t("toast_undo", { n }));
});

$("pf-reset-all").addEventListener("click", () => {
    if (!confirm(t("reset_confirm"))) return;
    state.found = [];
    state.hint = "empty";
    checkedSet.clear();
    commit();
    toast(t("toast_reset"));
});

$("menu-toggle").addEventListener("click", () => $("side-panel").classList.toggle("open"));

document.querySelectorAll("[data-lang]").forEach(btn =>
    btn.addEventListener("click", () => setLanguage(btn.dataset.lang)));

document.addEventListener("pf-langchange", () => {
    hidePopover();
    hideCatTooltip();
    if ($("pf-about-dialog").open) renderCredits();
    render();
});

applyStaticI18n();
buildMarkers();
changeRegion(currentRegion);
requestAnimationFrame(updateCatSizes);
