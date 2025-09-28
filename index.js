require('./config');
const { TELEGRAM_TOKEN, USE_WHATSAPP } = require('./config');

if (TELEGRAM_TOKEN) {
    console.log("🚀 Démarrage du bot Telegram...");
    require('./telegram');
} else if (USE_WHATSAPP) {
    console.log("🚀 Démarrage du bot WhatsApp...");
    require('./whatsapp');
} else {
    console.log("❌ Aucun bot configuré, ajoute TELEGRAM_TOKEN ou active USE_WHATSAPP=true");
}