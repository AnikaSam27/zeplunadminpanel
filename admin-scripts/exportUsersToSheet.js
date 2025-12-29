const admin = require("firebase-admin");
const { google } = require("googleapis");
const path = require("path");

// 🔹 Firebase Admin Init
admin.initializeApp({
  credential: admin.credential.cert(
    require(path.join(__dirname, "..", "firebaseServiceAccount.json"))
  ),
});

// 🔹 Google Sheets Auth
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, "googleServiceAccount.json"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const SPREADSHEET_ID = "1gKQvxBrvR31Eh9alFXZ89GQ2uxK62sI9XTLuaLV2RVc"; // Replace with your Sheet ID

async function exportAllFirebaseUsers() {
  const sheets = google.sheets({
    version: "v4",
    auth: await auth.getClient(),
  });

  let users = [];
  let nextPageToken;

  do {
    const result = await admin.auth().listUsers(1000, nextPageToken);
    result.users.forEach((user) => {
      users.push([
        user.email || "N/A", // Email
        user.providerData.map((p) => p.providerId).join(", "), // Provider
        user.metadata.creationTime
          ? new Date(user.metadata.creationTime).toLocaleString()
          : "N/A",
        user.metadata.lastSignInTime
          ? new Date(user.metadata.lastSignInTime).toLocaleString()
          : "N/A",
      ]);
    });
    nextPageToken = result.pageToken;
  } while (nextPageToken);

  // Clear previous data in Sheet (optional)
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: "Sheet1!A2:D",
  });

  // Write users to Sheet
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: "Sheet1!A2",
    valueInputOption: "RAW",
    requestBody: { values: users },
  });

  console.log(`✅ ${users.length} Firebase Auth users exported to Google Sheet`);
}

exportAllFirebaseUsers().catch((err) =>
  console.error("❌ Error exporting users:", err.message)
);
