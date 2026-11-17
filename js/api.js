// Data layer. Picks a source in this order:
//   1. proxy  – FILM_FINDER.proxyUrl (a server holds the TMDB key)
//   2. key    – a TMDB key the visitor saved in this browser
//   3. demo   – bundled sample data, no network needed
window.FilmAPI = (() => {
  const cfg = window.FILM_FINDER || {};
  const KEY = "filmfinder:tmdbKey";
  const IMG = "https://image.tmdb.org/t/p/";
  const cache = new Map();

  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } },
    remove: (k) => { try { localStorage.removeItem(k); } catch { /* storage unavailable */ } },
  };

  const mode = () => (cfg.proxyUrl ? "proxy" : store.get(KEY) ? "key" : "demo");
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  async function request(path, params = {}) {
    const m = mode();
    const base = m === "proxy" ? cfg.proxyUrl.replace(/\/?$/, "/") : "https://api.themoviedb.org/3/";
    const url = new URL(path, base);
    Object.entries({ language: "en-US", ...params }).forEach(([k, v]) => v != null && url.searchParams.set(k, v));
    const id = url.toString(); // cache id never contains the key
    if (cache.has(id)) return cache.get(id);
    if (m === "key") url.searchParams.set("api_key", store.get(KEY));

    let res;
    try {
      res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    } catch {
      throw new Error("Couldn't reach TMDB. Check your connection and try again.");
    }
    if (res.status === 401) throw new Error("TMDB rejected that API key.");
    if (!res.ok) throw new Error(`TMDB returned an error (${res.status}). Try again.`);
    const data = await res.json();
    cache.set(id, data);
    return data;
  }

  const normalize = (d) => ({
    id: d.id,
    title: d.title,
    year: (d.release_date || "").slice(0, 4),
    overview: d.overview || "",
    rating: d.vote_average ? Math.round(d.vote_average * 10) / 10 : null,
    runtime: d.runtime || null,
    genres: (d.genres || []).map((g) => g.name),
    tagline: d.tagline || "",
    poster: d.poster_path ? `${IMG}w500${d.poster_path}` : null,
    backdrop: d.backdrop_path ? `${IMG}w1280${d.backdrop_path}` : null,
  });

  async function genres() {
    if (mode() === "demo") return window.SAMPLE_DATA.genres;
    return (await request("genre/movie/list")).genres;
  }

  async function randomMovie(genreId, seen = new Set()) {
    if (mode() === "demo") {
      await wait(350); // lets the loading state show, like a real request
      const { movies, genres: all } = window.SAMPLE_DATA;
      const inGenre = movies.filter((m) => !genreId || m.genres.includes(genreId));
      const fresh = inGenre.filter((m) => !seen.has(m.id));
      const m = pick(fresh.length ? fresh : inGenre);
      return normalize({
        ...m, release_date: m.year, vote_average: m.rating, poster_path: null, backdrop_path: null,
        genres: m.genres.map((id) => all.find((g) => g.id === id)),
      });
    }
    const data = await request("discover/movie", {
      with_genres: genreId || undefined, page: 1 + Math.floor(Math.random() * 5),
      sort_by: "popularity.desc", "vote_count.gte": 300, include_adult: false,
    });
    const usable = data.results.filter((m) => m.poster_path && m.overview);
    if (!usable.length) throw new Error("No films found for that genre. Try another.");
    const fresh = usable.filter((m) => !seen.has(m.id));
    return normalize(await request(`movie/${pick(fresh.length ? fresh : usable).id}`));
  }

  return {
    mode, genres, randomMovie,
    setKey(key) { store.set(KEY, key); cache.clear(); },
    clearKey() { store.remove(KEY); cache.clear(); },
  };
})();
