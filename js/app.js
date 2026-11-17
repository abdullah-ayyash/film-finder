// UI controller. All API data is inserted with textContent, never innerHTML.
(() => {
  const $ = (id) => document.getElementById(id);
  const el = {
    genres: $("genres"), find: $("find"), message: $("message"), result: $("result"),
    poster: $("film-poster"), title: $("film-title"), tagline: $("film-tagline"), meta: $("film-meta"),
    tags: $("film-tags"), overview: $("film-overview"), save: $("save"), skip: $("skip"),
    backdrop: $("backdrop"), wlList: $("wl-list"), wlEmpty: $("wl-empty"), wlCount: $("wl-count"),
    badge: $("count-badge"), wlClear: $("wl-clear"), mode: $("mode"), modeText: $("mode-text"), modeBtn: $("mode-btn"),
    settings: $("settings"), keyForm: $("key-form"), keyInput: $("key-input"), keyMsg: $("key-msg"),
  };
  const state = { genre: null, film: null, seen: new Set(), busy: false };
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const hue = (text) => [...text].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
  const runtime = (min) => (min ? `${Math.floor(min / 60)}h ${min % 60}m` : "");

  function renderPoster(box, film) {
    box.replaceChildren();
    box.removeAttribute("role");
    box.removeAttribute("aria-label");
    box.classList.toggle("fallback", !film.poster);
    if (film.poster) {
      box.style.background = "";
      const img = new Image();
      img.src = film.poster;
      img.alt = `Poster for ${film.title}`;
      img.width = 500; img.height = 750;
      box.append(img);
      return;
    }
    const h = hue(film.title);
    box.style.background = `linear-gradient(160deg, hsl(${h} 50% 30%), hsl(${(h + 50) % 360} 55% 11%))`;
    box.setAttribute("role", "img");
    box.setAttribute("aria-label", `Poster placeholder for ${film.title}`);
    const label = document.createElement("span");
    label.textContent = film.title;
    box.append(label);
  }

  function setBackdrop(film) {
    if (film.backdrop) {
      const img = new Image();
      img.onload = () => { el.backdrop.style.backgroundImage = `url("${film.backdrop}")`; el.backdrop.style.opacity = 1; };
      img.src = film.backdrop;
      return;
    }
    const h = hue(film.title);
    el.backdrop.style.backgroundImage = `radial-gradient(circle at 30% 20%, hsl(${h} 60% 35%), hsl(${(h + 60) % 360} 50% 8%) 70%)`;
    el.backdrop.style.opacity = 1;
  }

  function showMessage(text) { el.message.textContent = text; el.message.hidden = !text; }

  function syncSave() {
    const saved = state.film && Watchlist.has(state.film.id);
    el.save.textContent = saved ? "Saved. Remove from watchlist" : "Save to watchlist";
    el.save.setAttribute("aria-pressed", String(Boolean(saved)));
  }

  function show(film) {
    state.film = film;
    el.title.textContent = film.title;
    el.tagline.textContent = film.tagline;
    el.tagline.hidden = !film.tagline;
    el.meta.replaceChildren();
    if (film.rating) {
      const badge = document.createElement("span");
      badge.className = "rating";
      badge.textContent = `★ ${film.rating}`;
      el.meta.append(badge);
    }
    el.meta.append([film.year, runtime(film.runtime)].filter(Boolean).join(" · "));
    el.tags.replaceChildren(...film.genres.map((g) => Object.assign(document.createElement("li"), { textContent: g })));
    el.overview.textContent = film.overview;
    renderPoster(el.poster, film);
    setBackdrop(film);
    syncSave();
    el.result.hidden = false;
    el.title.focus({ preventScroll: true });
    el.result.scrollIntoView({ block: "start", behavior: reduceMotion ? "auto" : "smooth" });
  }

  async function find() {
    if (state.busy) return;
    state.busy = true;
    el.find.disabled = el.skip.disabled = true;
    el.result.setAttribute("aria-busy", "true");
    el.result.classList.add("loading");
    showMessage("");
    try {
      const film = await FilmAPI.randomMovie(state.genre, state.seen);
      state.seen.add(film.id);
      show(film);
    } catch (err) {
      showMessage(err.message);
    } finally {
      state.busy = false;
      el.find.disabled = el.skip.disabled = false;
      el.result.setAttribute("aria-busy", "false");
      el.result.classList.remove("loading");
    }
  }

  async function loadGenres() {
    state.genre = null;
    try {
      const list = await FilmAPI.genres();
      const make = (id, name) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "chip";
        b.textContent = name;
        b.setAttribute("aria-pressed", String(id === null));
        b.addEventListener("click", () => {
          state.genre = id;
          el.genres.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", String(c === b)));
        });
        return b;
      };
      el.genres.replaceChildren(make(null, "Any genre"), ...list.map((g) => make(g.id, g.name)));
    } catch (err) {
      showMessage(err.message);
    }
  }

  function renderMode() {
    const m = FilmAPI.mode();
    el.mode.hidden = m === "proxy";
    el.modeText.textContent = m === "demo" ? "Demo mode: 12 sample films, no network needed." : "Live data from TMDB.";
    el.modeBtn.textContent = m === "demo" ? "Use live TMDB data" : "Change API key";
  }

  function renderWatchlist() {
    const list = Watchlist.all();
    el.wlCount.textContent = list.length ? `(${list.length})` : "";
    el.badge.textContent = list.length;
    el.wlEmpty.hidden = list.length > 0;
    el.wlClear.hidden = list.length === 0;
    el.wlList.replaceChildren(...list.map((film) => {
      const li = document.createElement("li");
      li.className = "wl-card";
      const poster = document.createElement("div");
      poster.className = "poster";
      renderPoster(poster, film);
      const body = document.createElement("div");
      const h = document.createElement("h3");
      h.textContent = film.title;
      const info = document.createElement("p");
      info.className = "muted";
      info.textContent = [film.year, film.rating ? `★ ${film.rating}` : ""].filter(Boolean).join(" · ");
      const rm = document.createElement("button");
      rm.type = "button";
      rm.className = "link";
      rm.textContent = "Remove";
      rm.setAttribute("aria-label", `Remove ${film.title} from watchlist`);
      rm.addEventListener("click", () => Watchlist.remove(film.id));
      body.append(h, info, rm);
      li.append(poster, body);
      return li;
    }));
    syncSave();
  }

  let clearTimer;
  el.wlClear.addEventListener("click", () => {
    if (el.wlClear.dataset.armed) {
      clearTimeout(clearTimer);
      delete el.wlClear.dataset.armed;
      el.wlClear.textContent = "Clear all";
      return Watchlist.clear();
    }
    el.wlClear.dataset.armed = "1";
    el.wlClear.textContent = "Click again to confirm";
    clearTimer = setTimeout(() => { delete el.wlClear.dataset.armed; el.wlClear.textContent = "Clear all"; }, 3000);
  });

  el.find.addEventListener("click", find);
  el.skip.addEventListener("click", find);
  el.save.addEventListener("click", () => {
    if (!state.film) return;
    Watchlist.has(state.film.id) ? Watchlist.remove(state.film.id) : Watchlist.add(state.film);
  });
  window.addEventListener("watchlist:change", renderWatchlist);

  // API key dialog
  el.modeBtn.addEventListener("click", () => { el.keyMsg.textContent = ""; el.keyInput.value = ""; el.settings.showModal(); });
  $("key-cancel").addEventListener("click", () => el.settings.close());
  $("key-remove").addEventListener("click", async () => {
    FilmAPI.clearKey();
    el.settings.close();
    renderMode();
    await loadGenres();
  });
  el.keyForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const key = el.keyInput.value.trim();
    if (!key) return;
    el.keyMsg.textContent = "Checking key…";
    FilmAPI.setKey(key);
    try {
      await FilmAPI.genres();
      el.settings.close();
      renderMode();
      await loadGenres();
    } catch (err) {
      FilmAPI.clearKey();
      el.keyMsg.textContent = err.message;
    }
  });

  renderMode();
  renderWatchlist();
  loadGenres();
})();
