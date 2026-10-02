# Ashish Shajan — Portfolio

Personal portfolio website: **https://ashish480.github.io** (once published).

Plain HTML, CSS and JavaScript. There's no framework, no build step and nothing to install.

## Folder layout

```
portfolio/
├── index.html            ← the whole page (all text lives here)
├── 404.html              ← "page not found" page
├── assets/
│   ├── css/style.css     ← design: colours, fonts, layout
│   ├── js/main.js        ← interactions: theme toggle, menu, image viewer, LiDAR animation
│   ├── img/              ← portrait, icons, social-share image
│   │   └── projects/     ← project screenshots (.webp)
│   └── Ashish_Shajan_Resume.pdf
├── deploy.sh             ← publishes the site to GitHub Pages
├── site.webmanifest, robots.txt, sitemap.xml, .nojekyll   ← SEO / hosting helpers
└── README.md
```

## Preview it on your computer

```bash
cd ~/portfolio
python3 -m http.server 8000
```

Then open http://localhost:8000 in your browser. Press `Ctrl + C` in the terminal to stop.

## Publish it (free, on GitHub Pages)

**One-time setup:**

1. Sign in to GitHub as **Ashish480** and go to https://github.com/new
2. Repository name: `Ashish480.github.io` (exactly this). Set it to **Public** and leave every box unticked.
3. Click **Create repository**.

**Publish (the first time, and every time you change something):**

```bash
cd ~/portfolio
./deploy.sh "Describe what you changed"
```

When git asks for a password, paste a GitHub **personal access token**, not your account password. Create one at
https://github.com/settings/tokens (classic token, tick the `repo` scope).

After about a minute the site is live at **https://ashish480.github.io**. To confirm, open the repository, go to
**Settings → Pages**, and check that it shows "Your site is live".

## Common edits

| I want to… | Do this |
|---|---|
| Change any text | Edit `index.html`. Each section is marked with a big `====` comment. |
| Update the résumé | Replace `assets/Ashish_Shajan_Resume.pdf` and keep the same file name. |
| Change the photo | Replace `assets/img/portrait.webp` with a square image. |
| Add a project | In `index.html`, copy one `<article class="project">…</article>` block, edit the text, and put new images in `assets/img/projects/`. |
| Add a small project card | Copy one `<article class="mini">…</article>` block under "More builds". |
| Change the accent colour | In `assets/css/style.css`, change `--accent` (there's one value for dark mode and one for light). |

**Tip:** convert screenshots to `.webp` so the site stays fast. Use https://squoosh.app, or run
`python3 -c "from PIL import Image; Image.open('in.png').save('out.webp', quality=82)"`.

## Using your own domain later (optional)

If you buy a domain such as `ashishshajan.com`:

1. Add a file called `CNAME` to this folder containing just `ashishshajan.com`.
2. At your domain registrar, point the domain to GitHub Pages
   ([GitHub's guide](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)).
3. Replace `https://ashish480.github.io` with your domain in `index.html`, `robots.txt` and `sitemap.xml`.
