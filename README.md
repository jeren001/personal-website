# Jeren's Personal Website

A clean multi-page personal website built with HTML5, CSS3, and vanilla JavaScript.

## Pages

- `index.html` - Home page
- `about.html` - Personal background and life gallery
- `projects.html` - Project collection placeholder
- `contact.html` - Contact form foundation

## Structure

```text
.
├── about.html
├── contact.html
├── index.html
├── projects.html
├── script.js
├── sitemap.xml
├── style.css
└── assets/
    ├── profile.jpg
    ├── backgrounds/
    │   ├── home-bg.jpg
    │   ├── about-bg.jpg
    │   ├── projects-bg.jpg
    │   └── contact-bg.jpg
    └── life/
        ├── life-1.jpg
        ├── life-2.jpg
        ├── life-3.jpg
        ├── life-4.jpg
        ├── life-5.jpg
        └── life-6.jpg
```

## Run locally

No build step is required. Open `index.html` directly in a browser, or serve the directory with any static file server:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

The JPG files in `assets/` are local placeholders. Replace them with final imagery while keeping the same filenames, or update the references in `style.css` and the HTML pages.
