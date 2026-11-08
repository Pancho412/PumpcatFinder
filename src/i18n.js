// Textos de la interfaz en español (es) e inglés (en).
//   {nombre} se reemplaza por un valor; en los textos con formato, los valores salen en negrita
//   y "\n" es un salto de línea.
const I18N = {
    es: {
        lang_name: "Español",
        regions_aria: "Regiones",
        progress_title: "Gatos encontrados",
        menu_aria: "Abrir panel",
        reset_view: "⤢ Ver todo",
        reset_view_title: "Restablecer zoom",
        hint_title: "Pista actual",
        cand_title: "Escondites posibles",
        log_title: "Registro",
        undo: "↶ Deshacer",
        undo_title: "Quitar el último registro",
        reset_all: "Reiniciar búsqueda",
        found_title_default: "¡Gato encontrado!",
        where_went: "¿A qué región se fue?",
        choose_later: "Elegir después",
        empty_title: "No quedan posibles escondites",
        ok: "Entendido",

        region_kanto: "Kanto",
        region_johto: "Johto",
        region_hoenn: "Hoenn",
        region_sinnoh: "Sinnoh",
        region_unova: "Teselia",

        no_city: "sin ciudad",
        no_data: "sin datos",
        starts_in: "Empieza en {city}",
        locked_final: "El #30 siempre está en la ciudad donde empezaste ({region}).",
        locked_stay: "El gato sigue en {region} ({run}/{quota}). No cambia de región hasta agotar sus escondites.",
        locked_new: "Ahora el gato está en una región que aún no visitas: {regions}.",

        empty_manual: "Ya marcaste como revisados todos los escondites conocidos de {region} con la pista {hint}.\n\nRevisa de nuevo los escondites y reportar a Pancho",
        empty_found: "Todos los escondites conocidos de {region} con la pista {hint} están en ciudades donde ya encontraste al gato.\n\nRevisa que la pista y la región sean las correctas. Si lo son, puede que este escondite todavía no esté registrado en el mapa.",

        select_hint: "— Selecciona una pista —",
        cand_pick_hint: "Elige una pista para ver dónde puede estar el gato en {region}.",
        cand_none: "No hay escondites conocidos en {region} con esta pista. Revisa la región o puede que falte en los datos.",
        cand_no_data: "Todavía no hay escondites registrados para {region}.",
        view_on_map: "Ver en el mapa",
        spot: "escondite {n}",
        already_found: "ya encontrado #{n}",
        uncheck: "Corregir",
        checked_no: "Revisado, no está",
        found_here: "¡Lo encontré aquí!",

        slot_final: "#{n}: siempre está donde hablaste con el gato la primera vez",
        slot_searching: "#{n}: buscando en {region}",
        slot_manual: "#{n}: escribe una ciudad si ya encontraste este gato",
        log_manual: "ingresado a mano",
        log_no_hint: "sin pista",
        log_delete: "Eliminar este registro",
        add_city: "agregar ciudad",
        add_to_log: "Agregar al registro",
        city_unknown_confirm: "\"{city}\" no está en la lista de ciudades. ¿Agregarla igual en {region}?",
        city_locked_confirm: "{locked}\n\n{city} es de {region}. ¿Agregarla igual?",

        toast_log_complete: "¡Registro completo! 🎃",
        toast_manual_final: "#{n} {city} agregado. El #30 está en la ciudad donde empezaste.",
        toast_manual_region_done: "#{n} {city} · región terminada. Elige arriba la región donde está ahora.",
        toast_manual_moved: "#{n} {city} agregado. Ahora el gato está en {region}.",
        toast_manual_added: "#{n} {city} agregado",

        tt_found: "Ya encontrado aquí (#{n})",
        tt_checked: "Revisado — no estaba",
        tt_click: "Clic para marcar",
        pop_found_city: "Ya encontraste al gato en esta ciudad (#{n}).",
        pop_yes: "✓  ¡Lo encontré aquí!",
        pop_undo: "↺  Quitar gris",
        pop_no: "✗  Revisado, no está",

        toast_all_found: "¡Encontraste los 30 gatos! 🎃",
        toast_found_final: "Gato #{n} registrado. El #30 está en la ciudad donde empezaste ({region}), pista \"{hint}\".",
        toast_found_moved: "Gato #{n} en {city} registrado. Ahora el gato está en {region}.",
        toast_found: "Gato #{n} en {city} registrado. Cambia la pista si te dio otra.",
        found_dialog_title: "¡Gato #{n} encontrado!",
        found_dialog_text: "{city} · {region} ({count}/{max}).",
        found_dialog_done: "Terminaste esta región: ahora el gato fue otra región.",

        toast_undo: "Registro #{n} eliminado",
        toast_undo_city: "Registro #{n} eliminado ({city})",
        reset_confirm: "¿Borrar todo el registro y empezar de nuevo?",
        toast_reset: "Búsqueda reiniciada",

        about_btn: "ℹ Acerca de",
        about_title: "Agradecimientos especiales",
        about_intro: "Esta herramienta fue posible gracias a:",
        about_congrats: "¡Completaste la búsqueda de los 30 gatos! 🎃",
        close: "Cerrar"
    },

    en: {
        lang_name: "English",
        regions_aria: "Regions",
        progress_title: "Cats found",
        menu_aria: "Open panel",
        reset_view: "⤢ Show all",
        reset_view_title: "Reset zoom",
        hint_title: "Current hint",
        cand_title: "Possible hiding spots",
        log_title: "Log",
        undo: "↶ Undo",
        undo_title: "Remove the last entry",
        reset_all: "Reset search",
        found_title_default: "Cat found!",
        where_went: "Which region did it go to?",
        choose_later: "Choose later",
        empty_title: "No possible hidding spot left",
        ok: "Got it",

        region_kanto: "Kanto",
        region_johto: "Johto",
        region_hoenn: "Hoenn",
        region_sinnoh: "Sinnoh",
        region_unova: "Unova",

        no_city: "no city",
        no_data: "no data",
        starts_in: "Starts in {city}",
        locked_final: "Cat #30 is always in the city where you started ({region}).",
        locked_stay: "The cat is still in {region} ({run}/{quota}). It won't change region until all its hiding spots are used.",
        locked_new: "The cat is now in a region you haven't visited yet: {regions}.",

        empty_manual: "You've already marked every known hiding spot in {region} with the hint {hint} as checked.\n\n Double check every spot to make sure that the cat isn't there and then report this to Pancho.",
        empty_found: "Every known hiding spot in {region} with the hint {hint} is in a city where you already found the cat.\n\nMake sure the hint and region are correct. If they are, this hiding spot may not be on the map yet.",

        select_hint: "— Select a hint —",
        cand_pick_hint: "Pick a hint to see where the cat could be",
        cand_none: "No known hiding spots in {region} with this hint. Check the region, or it may be missing from the data.",
        cand_no_data: "There are no hiding spots registered for {region} yet.",
        view_on_map: "Show on map",
        spot: "spot {n}",
        already_found: "already found #{n}",
        uncheck: "Uncheck",
        checked_no: "Checked, not here",
        found_here: "Found it here!",

        slot_final: "#{n}: always where you first talked to the cat",
        slot_searching: "#{n}: searching in {region}",
        slot_manual: "#{n}: type a city if you already found this cat",
        log_manual: "entered manually",
        log_no_hint: "no hint",
        log_delete: "Delete this entry",
        add_city: "add city",
        add_to_log: "Add to log",
        city_unknown_confirm: "\"{city}\" is not in the city list. Add it anyway in {region}?",
        city_locked_confirm: "{locked}\n\n{city} is in {region}. Add it anyway?",

        toast_log_complete: "Log complete! 🎃",
        toast_manual_final: "#{n} {city} added. Cat #30 is in the city where you started.",
        toast_manual_region_done: "#{n} {city} · region finished. Pick the region where it is now above.",
        toast_manual_moved: "#{n} {city} added. The cat is now in {region}.",
        toast_manual_added: "#{n} {city} added",

        tt_found: "Already found here (#{n})",
        tt_checked: "Checked — not here",
        tt_click: "Click to mark",
        pop_found_city: "You already found the cat in this city (#{n}).",
        pop_yes: "✓  Found it here!",
        pop_undo: "↺  Remove gray",
        pop_no: "✗  Checked, not here",

        toast_all_found: "You found all 30 cats! 🎃",
        toast_found_final: "Cat #{n} logged. Cat #30 is in the city where you started ({region}), hint \"{hint}\".",
        toast_found_moved: "Cat #{n} in {city} logged. The cat is now in {region}.",
        toast_found: "Cat #{n} in {city} logged. Change the hint if it gave you a new one.",
        found_dialog_title: "Cat #{n} found!",
        found_dialog_text: "{city} · {region} ({count}/{max}).",
        found_dialog_done: "Region finished: the cat moved to another region",

        toast_undo: "Entry #{n} removed",
        toast_undo_city: "Entry #{n} removed ({city})",
        reset_confirm: "Delete the whole log and start over?",
        toast_reset: "Search reset",

        about_btn: "ℹ About",
        about_title: "Special thanks",
        about_intro: "This tool was made possible thanks to:",
        about_congrats: "You completed the search for all 30 cats! 🎃",
        close: "Close"
    }
};

const LANG_KEY = "pumpcat-lang";
const LANGS = Object.keys(I18N);

let LANG = (() => {
    try {
        const saved = localStorage.getItem(LANG_KEY);
        if (saved && I18N[saved]) return saved;
    } catch (e) { }
    return (navigator.language || "").toLowerCase().startsWith("es") ? "es" : "en";
})();

/** Texto traducido con {variables} reemplazadas. */
function t(key, vars = {}) {
    const str = (I18N[LANG] && I18N[LANG][key]) ?? I18N.en[key] ?? key;
    return str.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

/** Igual que t(), pero devuelve nodos: las variables en negrita y "\n" como salto de línea. */
function tRich(key, vars = {}) {
    const str = (I18N[LANG] && I18N[LANG][key]) ?? I18N.en[key] ?? key;
    const nodes = [];
    str.split(/(\{\w+\}|\n)/).forEach(part => {
        if (!part) return;
        if (part === "\n") { nodes.push(document.createElement("br")); return; }
        const m = part.match(/^\{(\w+)\}$/);
        if (m && m[1] in vars) {
            const b = document.createElement("b");
            b.textContent = String(vars[m[1]]);
            nodes.push(b);
        } else {
            nodes.push(document.createTextNode(part));
        }
    });
    return nodes;
}

/** Aplica los textos fijos del HTML: data-i18n, data-i18n-title, data-i18n-aria, data-i18n-placeholder. */
function applyStaticI18n(root = document) {
    document.documentElement.lang = LANG;
    root.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
    root.querySelectorAll("[data-i18n-title]").forEach(el => { el.title = t(el.dataset.i18nTitle); });
    root.querySelectorAll("[data-i18n-aria]").forEach(el => { el.setAttribute("aria-label", t(el.dataset.i18nAria)); });
    root.querySelectorAll("[data-i18n-placeholder]").forEach(el => { el.placeholder = t(el.dataset.i18nPlaceholder); });
    root.querySelectorAll("[data-lang]").forEach(el => el.classList.toggle("active", el.dataset.lang === LANG));
}

function setLanguage(lang) {
    if (!I18N[lang]) return;
    LANG = lang;
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) { }
    applyStaticI18n();
    document.dispatchEvent(new CustomEvent("pf-langchange", { detail: lang }));
}
