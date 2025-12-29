const express = require("express");
const admin = require("firebase-admin");
const path = require("path");

admin.initializeApp({
  credential: admin.credential.cert(
    require(path.join(__dirname, "../firebaseServiceAccount.json"))
  ),
});

const app = express();
app.get("/api/user-stats", async (req, res) => {
  try {
    let totalUsers = 0;
    let loggedInUsers = 0;
    let nextPageToken;

    do {
      const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
      totalUsers += listUsersResult.users.length;
      loggedInUsers += listUsersResult.users.filter(
        (u) => u.metadata.lastSignInTime
      ).length;
      nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);

    res.json({ totalUsers, loggedInUsers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(5000, () => console.log("User stats API running on port 5000"));
