/**
 * NEUQUA — optional waitlist backend
 * -----------------------------------
 * This is a tiny, beginner-friendly Express server. All it does is:
 *   1. Listen for POST requests at /api/waitlist
 *   2. Save the submitted email to a local file called waitlist.json
 *   3. Send back a success message
 *
 * You do NOT need this to view or demo the website — index.html works
 * fine on its own. This is only here for when you want real email
 * addresses to actually be saved somewhere. See README.md, section
 * "Adding a real backend", for the full step-by-step explanation.
 */

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, "waitlist.json");

// Let the website (running on a different port, e.g. Live Server's 5500)
// talk to this server. Without this, the browser blocks the request.
app.use(cors());

// Let Express understand JSON sent from the website's fetch() call.
app.use(express.json());

// Make sure waitlist.json exists before we try to read from it.
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// POST /api/waitlist  →  { "email": "someone@example.com" }
app.post("/api/waitlist", (req, res) => {
  const email = (req.body.email || "").trim();

  if (!email || !email.includes("@")) {
    return res.status(400).json({ ok: false, message: "That doesn't look like a valid email." });
  }

  const existing = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));

  if (existing.includes(email)) {
    return res.json({ ok: true, message: "You're already on the list!" });
  }

  existing.push(email);
  fs.writeFileSync(DATA_FILE, JSON.stringify(existing, null, 2));

  res.json({ ok: true, message: "You're on the list." });
});

// A simple health check so you can confirm the server is running
// by visiting http://localhost:3001/ in a browser.
app.get("/", (req, res) => {
  res.send("NEUQUA waitlist server is running.");
});

app.listen(PORT, () => {
  console.log(`NEUQUA waitlist server listening at http://localhost:${PORT}`);
});
