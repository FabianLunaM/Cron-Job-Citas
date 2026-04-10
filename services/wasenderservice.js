// services/wasenderService.js
const axios = require('axios');

async function sendWhatsAppMessage(to, text) {
  try {
    await axios.post(
      `${process.env.WASENDER_API_URL}/send-message`,
      { to, text },
      {
        headers: {
          Authorization: `Bearer ${process.env.WASENDER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log(`✅ Mensaje enviado a ${to}`);
  } catch (err) {
    console.error("❌ Error enviando mensaje:", err.response?.data || err.message);
  }
}

module.exports = { sendWhatsAppMessage };
