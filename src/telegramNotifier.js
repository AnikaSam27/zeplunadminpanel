// src/telegramNotifier.js
import axios from "axios";

// 🔹 Your Telegram Bot Token
const TELEGRAM_BOT_TOKEN = "8379481651:AAG61cqEsm-02n1qUkLvJgRSeEK7UEipk1s";

// 🔹 Chat IDs of people who should receive notifications
// You can add multiple IDs here separated by commas
const CHAT_IDS = ["7960347614"]; // Add more later if needed

// 🔹 Function to send messages
export const sendTelegramNotification = async (message) => {
  try {
    for (const chatId of CHAT_IDS) {
      await axios.post(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          chat_id: chatId,
          text: message,
          parse_mode: "Markdown", // so emojis & bold text work
        }
      );
    }
    console.log("✅ Telegram message sent successfully!");
  } catch (error) {
    console.error("❌ Failed to send Telegram message:", error);
  }
};
