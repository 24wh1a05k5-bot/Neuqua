# NEUQUA — Intelligent Vestibular Monitoring, Reimagined.

A cinematic, 3D-transition product website for **NEUQUA**, a concept smart-glasses
platform for vestibular health, balance monitoring, and vertigo-related insight.
Built with vanilla HTML/CSS/JS, Three.js, and GSAP + ScrollTrigger — no build
tools required.

## A quick, honest note on the "3D human" request

You asked for real human faces, not cartoons — good instinct for a medical
product. But there's an important technical limit worth knowing about:
**procedurally-generated 3D code (Three.js) cannot produce a realistic human
face.** Photoreal 3D humans in film/product renders are built from actual
3D scans or hand-sculpted models by artists, or rendered offline with tools
far beyond what runs in a browser tab — not written as geometry in JavaScript.
A code-generated "face" would come out looking uncanny or cartoonish, which
is exactly what you didn't want.

So instead, this site uses two things together, which is how real companies
(Apple, Oura, Whoop) actually build pages like this:

1. **Real photography** of real people (sourced from Unsplash, free to use
   under the [Unsplash License](https://unsplash.com/license)) for every
   moment a human needs to appear — wearing the glasses, walking, turning.
2. **A procedurally-built 3D model of the glasses themselves** (the product,
   not a face) rendered in Three.js — rotating, catching light, and
   traveling through the page as you scroll. This is the one thing code
   *can* render convincingly: a man-made object with clean geometry.

If you later want literal photoreal 3D human avatars (e.g. for a product
demo video), that needs either stock 3D character assets (e.g. from
RenderPeople, Reallusion, or Mixamo+a scanned head) dropped into a tool
like Blender, or an AI image/video generation tool — not something written
from scratch in Three.js. Happy to help you source or integrate either if
you want to go that route later.

## Project structure

```
neuqua/
├── index.html             Main page — all 6 scenes + loader + nav
├── css/
│   └── style.css          Design tokens, layout, overlays, responsive rules
├── js/
│   └── main.js             Three.js glasses model, GSAP choreography, UI logic
├── server/                 OPTIONAL backend for the waitlist form (see below)
│   ├── server.js
│   └── package.json
├── assets/                 Empty — reserved for any images you add locally
└── README.md               This file
```

Three.js and GSAP load from CDN (`jsdelivr`) in `index.html` — nothing to
install for the front end. The photography is hotlinked directly from
Unsplash's CDN, so you'll need an internet connection to see the images
(this is normal practice and keeps the zip small and properly attributed).

## Running the website (VS Code)

1. Unzip the folder anywhere on your machine.
2. Open the folder in VS Code (`File → Open Folder…`).
3. Install the **Live Server** extension (by Ritwick Dey) if you don't
   already have it, from the Extensions panel.
4. Right-click `index.html` → **"Open with Live Server."**
5. Your browser opens at something like `http://127.0.0.1:5500/index.html`.

The site works completely on its own at this point — the waitlist form
at the bottom already "succeeds" with a friendly message, it just doesn't
save anywhere yet. That's what the optional backend below is for.

## What each scene does

| # | Section id | What it shows |
|---|------------|----------------|
| 1 | `#hero` | Product reveal — the 3D glasses spin in on load; headline + "Sense → Analyze → Understand" |
| 1b| `#design` | Close-up framing + spec list; explicitly states what is *not* shown (internals) |
| 2 | `#monitoring` | Real photo of a person wearing glasses + a conceptual eye-tracking overlay (animated SVG rings, not real data) |
| 3 | `#movement` | Real photo of a person walking + an abstract motion-path overlay and two stat chips |
| 4 | `#analysis` | A dashboard mockup: two "data" waveforms flowing into a stability-index gauge |
| 5 | `#alert` | A phone mockup showing the "Abnormal Vestibular Event Detected" notification |
| 6 | `#waitlist` | Final floating-product moment + an email waitlist form |

The 3D glasses model never disappears — it's one `<canvas>` fixed behind
the whole page, and GSAP's `ScrollTrigger` moves/rotates/rescales it as
each section scrolls into view (see the `scrollTargets` array near the
bottom of `main.js` if you want to change where it travels).

## Confidentiality choices baked into the design

As requested, the 3D glasses model shows two small inward-facing camera
domes on the inner rim — enough to communicate what the product does —
but the model has **no internal wiring, battery, PCB, or processor
geometry**, and the "Analysis" section explicitly states that the
algorithm and data pipeline are not shown. The spec list and the
dashboard section both carry a one-line disclosure saying so, rather
than leaving it unstated.

---

## Adding a real backend (optional, explained from scratch)

Right now, when someone types their email into the waitlist form, nothing
is actually saved anywhere — the page just shows a "thanks" message. If
you want real emails to be stored somewhere (even just in a simple file
on your own computer to start), you need a **backend**: a small program
that runs separately from the website and knows how to save things.

Think of it like this: your website (`index.html`) is like a shop window
— people can look and click, but it can't remember anything by itself.
The backend is the stockroom behind the shop — it's where things actually
get written down and kept.

I've already written a minimal one for you in the `server/` folder. Here's
how to turn it on, step by step.

### Step 1 — Install Node.js (one-time setup)

Node.js is the program that lets your computer run JavaScript outside the
browser — it's what powers the backend.

1. Go to [nodejs.org](https://nodejs.org) and download the **LTS** version.
2. Run the installer, clicking "Next" through the defaults.
3. Check it worked: open a terminal (in VS Code: **Terminal → New Terminal**)
   and type:
   ```
   node -v
   ```
   If you see a version number like `v20.11.0`, you're good.

### Step 2 — Install the backend's dependencies

In the VS Code terminal, move into the `server` folder and install the
two small libraries `server.js` needs (`express` for handling web
requests, `cors` for letting your webpage talk to it):

```
cd server
npm install
```

This creates a `node_modules` folder — that's normal, it's just where
the downloaded libraries live. You won't need to touch it.

### Step 3 — Start the backend

Still inside the `server` folder, run:

```
npm start
```

You should see:
```
NEUQUA waitlist server listening at http://localhost:3001
```

Leave this terminal window open and running — closing it turns the
backend off. (You can open a *second* terminal tab for Live Server so
both run at the same time.)

### Step 4 — Connect the website to the backend

Right now `js/main.js` just fakes a success message. To actually send
the email to your running backend, open `js/main.js`, find this part
near the bottom (inside the `WAITLIST FORM` section):

```js
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = form.email.value;
  // Front-end only placeholder — see README for wiring this to a real backend.
  formNote.textContent = `Thanks — we'll reach out at ${email} when NEUQUA is ready for early access.`;
  form.reset();
});
```

Replace it with this version, which actually sends the email to your
backend and shows whatever message it sends back:

```js
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = form.email.value;
  try {
    const res = await fetch("http://localhost:3001/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    formNote.textContent = data.message;
    if (data.ok) form.reset();
  } catch (err) {
    formNote.textContent = "Couldn't reach the server — is it running?";
  }
});
```

Save the file, refresh the page (Live Server should auto-refresh), submit
the form, and then open `server/waitlist.json` — you'll see the email
address saved there as plain text.

### What's actually happening, in plain words

- Your **website** runs in the browser, on one address (Live Server's
  `127.0.0.1:5500`).
- Your **backend** runs separately, on a different address
  (`localhost:3001`), and only understands one instruction right now:
  "if someone POSTs an email to `/api/waitlist`, save it."
- `fetch(...)` in the browser is just the website reaching out across
  to that other address and asking it to do that.
- `cors()` in `server.js` is the permission slip that lets a page running
  on one address talk to a server running on another — browsers block
  this by default for safety, so it has to be explicitly allowed.

### Where to go from here (optional, later)

This JSON-file version is perfect for learning and for a local demo, but
a few natural next steps if this becomes a real product:

- Swap the JSON file for a real database (e.g. **MongoDB** or
  **PostgreSQL**) once you have more than a handful of signups.
- Deploy the backend somewhere it stays running 24/7 (e.g. **Render**,
  **Railway**, or **Fly.io** all have simple free tiers for small
  Node.js/Express apps like this one).
- Add email verification (so people can't sign up with an email that
  isn't theirs) using a service like **Resend** or **SendGrid**.

None of that is required to use or demo the site as it stands — it works
perfectly well without any backend at all.

## Customizing

- **Colors / fonts** — CSS custom properties at the top of `css/style.css`
  (`:root { --ink, --blue, --violet, --text, ... }`).
- **Copy** — all section text lives in `index.html`, organized by section id.
- **Glasses geometry** — built in `main.js` inside `buildRim()` /
  `buildTemple()`; adjust the `TorusGeometry`/`CylinderGeometry` numbers
  to reshape the frame.
- **Scroll choreography** — the `scrollTargets` array in `main.js`.
- **Photography** — swap the `src` URLs in `index.html`'s `<img>` tags for
  your own images (local files in `assets/` work fine too).

## Browser support

Tested against current Chrome/Edge/Firefox/Safari. Requires WebGL for the
3D canvas — on a device without it, the canvas simply won't render, but
all page content (text, photos, forms) stays fully readable since it sits
in normal HTML on top of the canvas.
