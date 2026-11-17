// Watchlist persisted in localStorage. Fixes the old version's duplicate check by keying on film id.
window.Watchlist = (() => {
  const KEY = "filmfinder:watchlist";
  const OLD_KEY = "myMovies"; // format used by the original version of this project
  const read = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
  const write = (list) => { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* storage unavailable */ } };

  let items = read(KEY);
  if (!Array.isArray(items)) {
    const old = read(OLD_KEY); // migrate saved films from the original version
    items = Array.isArray(old)
      ? old.filter((o) => o && o.title).map((o) => ({ id: `legacy-${o.title}`, title: String(o.title), year: "", rating: null, poster: o.img || null }))
      : [];
    if (items.length) write(items);
  }

  const notify = () => window.dispatchEvent(new CustomEvent("watchlist:change"));
  return {
    all: () => [...items],
    has: (id) => items.some((f) => f.id === id),
    add(film) {
      if (this.has(film.id)) return;
      items.push({ id: film.id, title: film.title, year: film.year, rating: film.rating, poster: film.poster });
      write(items); notify();
    },
    remove(id) { items = items.filter((f) => f.id !== id); write(items); notify(); },
    clear() { items = []; write(items); notify(); },
  };
})();
