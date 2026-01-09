/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";

const SendNotification = () => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sendType, setSendType] = useState("now"); // now | schedule
  const [scheduledAt, setScheduledAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const BASE_URL = "https://customernotificationszeplun.onrender.com";

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${BASE_URL}/notifications/history`, {
        headers: { "x-admin-key": "supersecret123" },
      });
      const data = await res.json();
      if (data.success) {
  setHistory(data.notifications || data.history || []);
}
    } catch (err) {
      console.error("Failed to fetch notification history:", err);
    }
  };

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async () => {
    if (!title.trim() || !body.trim()) {
      alert("Title and message are required");
      return;
    }
    if (sendType === "schedule" && !scheduledAt) {
      alert("Please select date & time");
      return;
    }

    setLoading(true);
    try {
      const url =
        sendType === "now"
          ? `${BASE_URL}/notifications/send`
          : `${BASE_URL}/notifications/schedule`;

      const payload = {
        title: title.trim(),
        body: body.trim(),
        ...(sendType === "schedule" && {
  scheduledAt: new Date(scheduledAt).toISOString(),
}),

      };

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": "supersecret123",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        alert(
          sendType === "now"
            ? `Notification sent to ${data.sent} users`
            : "Notification scheduled successfully"
        );
        setTitle("");
        setBody("");
        setScheduledAt("");
        setSendType("now");
        fetchHistory(); // Refresh history
      } else {
        alert(data.error || "Failed to send notification");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return isNaN(d) ? "-" : d.toLocaleString();
  };

  return (
    <div
      className="page-container"
      style={{
        maxWidth: 700,
        margin: "0 auto",
        padding: 24,
        backgroundColor: "#f9f9f9",
        borderRadius: 12,
        boxShadow: "0px 4px 20px rgba(0,0,0,0.1)",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: 24, color: "#333" }}>
        🔔 Send Notification
      </h2>

      {/* Title */}
      <label style={{ fontWeight: 500 }}>Notification Title</label>
      <input
        type="text"
        placeholder="Enter title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{
          width: "100%",
          padding: 12,
          marginBottom: 16,
          borderRadius: 8,
          border: "1px solid #ccc",
          fontSize: 16,
          boxSizing: "border-box",
        }}
      />

      {/* Message */}
      <label style={{ fontWeight: 500 }}>Notification Message</label>
      <textarea
        placeholder="Enter message"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={5}
        style={{
          width: "100%",
          padding: 12,
          borderRadius: 8,
          border: "1px solid #ccc",
          fontSize: 16,
          marginBottom: 16,
          resize: "vertical",
          boxSizing: "border-box",
        }}
      />

      {/* Send Type */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontWeight: 500, marginRight: 16 }}>Delivery:</label>
        <label style={{ marginRight: 12 }}>
          <input
            type="radio"
            value="now"
            checked={sendType === "now"}
            onChange={() => setSendType("now")}
            style={{ marginRight: 6 }}
          />
          Send Now
        </label>

        <label>
          <input
            type="radio"
            value="schedule"
            checked={sendType === "schedule"}
            onChange={() => setSendType("schedule")}
            style={{ marginRight: 6 }}
          />
          Schedule
        </label>
      </div>

      {/* Schedule Date */}
      {sendType === "schedule" && (
        <>
          <label style={{ fontWeight: 500 }}>Schedule Date & Time</label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 8,
              border: "1px solid #ccc",
              fontSize: 16,
              marginBottom: 16,
              boxSizing: "border-box",
            }}
          />
        </>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          width: "100%",
          padding: 14,
          backgroundColor: "#007bff",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          fontSize: 16,
          cursor: "pointer",
          transition: "0.3s",
        }}
      >
        {loading
          ? sendType === "now"
            ? "Sending..."
            : "Scheduling..."
          : sendType === "now"
          ? "Send Notification"
          : "Schedule Notification"}
      </button>

      {/* Notification History */}
      <div style={{ marginTop: 40 }}>
        <h3>Notification History</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f0f0f0" }}>
              <th style={{ padding: 12, border: "1px solid #ccc" }}>Title</th>
              <th style={{ padding: 12, border: "1px solid #ccc" }}>Message</th>
              <th style={{ padding: 12, border: "1px solid #ccc" }}>Scheduled At</th>
              <th style={{ padding: 12, border: "1px solid #ccc" }}>Sent?</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", padding: 12 }}>
                  No notifications yet
                </td>
              </tr>
            ) : (
              history.map((n) => (
                <tr key={n.id}>
                  <td style={{ padding: 8, border: "1px solid #ccc" }}>{n.title}</td>
                  <td style={{ padding: 8, border: "1px solid #ccc" }}>{n.body}</td>
                  <td style={{ padding: 8, border: "1px solid #ccc" }}>
                    {n.scheduledAt ? new Date(n.scheduledAt).toLocaleString() : "-"}
                  </td>
                  <td style={{ padding: 8, border: "1px solid #ccc" }}>
                    {n.sent ? "Yes" : "No"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SendNotification;
