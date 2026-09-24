# prateekgarg.dev

Personal portfolio of Prateek Garg. Plain HTML, CSS and JavaScript with no build step, hosted on GitHub Pages.
Animation libraries (GSAP + ScrollTrigger + SplitText, Lenis, d3-geo, topojson) load from the jsDelivr CDN.

## Files

- `index.html`: all page content (edit text here)
- `styles.css`: layout and both themes (dark and light colour tokens are at the top)
- `main.js`: theme switch, smooth scroll, loader, hero network canvas, globe, and scroll animations
- `404.html`: not-found page
- `og-image.png`, `apple-touch-icon.png`: link-preview image and home-screen icon
- `robots.txt`, `sitemap.xml`: for search engines
- `CNAME`: custom domain for GitHub Pages

Deployments on the Reach globe are the `<li>` rows in `index.html`: `data-lat`/`data-lon` place the point,
`data-points="lat,lon,Label;..."` adds extra points, and `data-desc` is the hover/mobile description.

## Local preview

Open `index.html` in a browser, or serve the folder:

```bash
python -m http.server 8000
```

## Deploy

Push to the `main` branch. GitHub Pages publishes it automatically.
