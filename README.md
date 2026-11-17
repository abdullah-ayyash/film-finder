# Film Finder

Can't pick a film? Choose a genre, press a button and get a random film worth watching. Save favourites to a watchlist that persists in your browser.

**Live demo:** _add your GitHub Pages link here_

<!-- Add a screenshot or GIF here: docs/screenshot.png -->

## Features

- **Random film by genre:** a TMDB discover query on a random page of popular films, followed by a details request. It skips films without a poster or description and avoids repeats within a session.
- **Watchlist:** add and remove films, saved in `localStorage`. Duplicates are prevented by film id, and films saved by the original version are migrated automatically.
- **Demo mode:** works with no API key and no network, using 12 bundled sample films, so the live demo never breaks.
- **Atmosphere:** the film's backdrop becomes a blurred, dimmed background. Posters fall back to a generated placeholder.
- **Accessible:** keyboard friendly, focus moves to the new film, live status messages, visible focus states and reduced-motion support.

## Data sources and API key safety

The first version of this project committed a TMDB API key to the repository. Anything in a static site's JavaScript is public, so the app now supports three sources, chosen automatically:

| Mode | How it works | Key exposure |
| ---- | ------------ | ------------ |
| **Proxy** | Set `proxyUrl` in `js/config.js`. A small Cloudflare Worker (`worker/tmdb-proxy.js`) adds your key server-side. | Key never reaches the browser |
| **Bring your own key** | A visitor pastes a free TMDB key in the app. It is stored in their own browser only. | Visitor's own key |
| **Demo** | Bundled sample data. | None |

The proxy only forwards three read-only TMDB paths, rejects other origins, and sends cache headers.

### Deploy the proxy (optional, free)

1. Create a Cloudflare Worker and paste in `worker/tmdb-proxy.js`.
2. Add a secret `TMDB_KEY` (your v3 key) and a variable `ALLOWED_ORIGIN` (for example `https://your-username.github.io`).
3. Put the Worker URL in `js/config.js` as `proxyUrl`.

## Run it

Open `index.html` in a browser. No install and no build step.

## Deploy

Settings → Pages → Deploy from a branch → `main` / `/ (root)`.

## Structure

```
index.html
css/styles.css
js/config.js        optional proxy URL
js/sample-data.js   demo films
js/api.js           data layer (proxy / key / demo), caching, error handling
js/watchlist.js     localStorage watchlist with migration
js/app.js           UI
worker/             optional Cloudflare Worker proxy
```

Data and images: [TMDB](https://www.themoviedb.org/). This product uses the TMDB API but is not endorsed or certified by TMDB.
