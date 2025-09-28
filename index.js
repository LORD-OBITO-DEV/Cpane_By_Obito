import './config.js';
import { config } from './config.js';

if(process.env.BOT_TOKEN) {
    console.log("🔹 Démarrage du bot Telegram...");
    import('./telegram.js');
} else {
    console.log("🔹 Démarrage du bot WhatsApp...");
    import('./whatsapp.js');
}