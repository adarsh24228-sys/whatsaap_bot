console.log("🔥 SERVER STARTED (SIMPLIFIED VERSION) 🔥");

const express = require("express");
const cors = require("cors");
const path = require("path");
const { google } = require("googleapis");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

/* ================= SERVE FRONTEND ================= */

// serve static files
app.use(express.static(__dirname));

// explicitly serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

/* ================= GOOGLE SHEET CONFIG ================= */

const SPREADSHEET_ID = "1WUbHjjt30otS1N2KAcBn_xspv-e2pAgEl9GlJ5SKs9k";
const SHEET_NAME = "Sheet1";

/* ================= GOOGLE AUTH ================= */

if (!process.env.GOOGLE_CREDENTIALS) {
  console.error("❌ GOOGLE_CREDENTIALS not set");
}

let auth;
try {
  auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"]
  });
} catch (err) {
  console.error("❌ Failed to parse GOOGLE_CREDENTIALS", err);
}

/* ================= FETCH CONTACTS ================= */

async function getContacts() {
  const sheets = google.sheets({
    version: "v4",
    auth: auth
  });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A2:C`
  });

  const rows = res.data.values || [];

  const contacts = rows
    .map((row, i) => ({
      rowNumber: i + 2,
      name: row[0] || "Student",
      number: row[1] || "",
      number2: row[2] || ""
    }))
    .filter(r => r.number);

  return contacts.map(c => ({
    ...c,
    message: `Namaste ${c.name},

This is from SimplifiedMinds.
Please fill this form https://forms.gle/djeVC2Y1BxizATGX9 so that we can give you access to view your chapter wise test result marks.

Thank you`
  }));
}

/* ================= TEST API ================= */

app.get("/test", async (req, res) => {
  try {
    const sheets = google.sheets({
      version: "v4",
      auth: auth
    });

    const response = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID
    });

    res.json({
      success: true,
      title: response.data.properties.title
    });
  } catch (err) {
    console.error("❌ TEST ERROR:", err.message);
    res.json({ error: err.message });
  }
});

/* ================= MAIN API ================= */

app.get("/api/contacts", async (req, res) => {
  try {
    const contacts = await getContacts();
    res.json({ contacts });
  } catch (err) {
    console.error("❌ CONTACT ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ================= START SERVER ================= */

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
