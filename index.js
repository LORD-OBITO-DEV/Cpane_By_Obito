import 'dotenv/config';
import { Telegraf } from 'telegraf';
import { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeInMemoryStore, jidDecode } from '@whiskeysockets/baileys';
import pino from 'pino';
import chalk from 'chalk';
import readline from 'readline';
import { Boom } from '@hapi/boom';

import config from './system/config.js';
import telegramHandler from './telegram.js';
import whatsappHandler from './whatsapp.js';
import { smsg } from './system/lib/myfunction.js';

// ====================== READLINE PROMPT ======================
const question = (text) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(text, ans => { rl.close(); resolve(ans); }));
};

// ====================== WHATSAPP STORE ======================
const store = makeInMemoryStore({ logger: pino().child({ level: 'silent' }) });

// ====================== START WHATSAPP ======================
async function startWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('./session');

  const client = makeWASocket({
    logger: pino({ level: 'silent' }),
    printQRInTerminal: true,
    auth: state,
    browser: ["Ubuntu", "Chrome", "20.0.04"]
  });

  // ====================== PAIRING ======================
  if (!client.authState.creds.registered) {
    console.log(chalk.cyan("🔗 Time To Pairing!"));
    const phoneNumber = await question(chalk.green("📞 Enter your number (ex: 225xxxx):\n"));
    const nomor = phoneNumber.trim();

    const pw = await question("÷ Password: ");
    if (pw !== "OBITO304") {
      console.log("❌ Password Incorrect. Restart Panel.");
      process.exit();
    }

    console.log("✅ Password correct √");
    const code = await client.requestPairingCode(nomor, "OBITODEV");
    console.log(chalk.blue("-✅ Connected : ") + chalk.magenta.bold(code));
  }

  client.public = true;

  // ====================== EVENTS ======================
  client.ev.on('connection.update', update => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
      console.log(`❌ WhatsApp disconnected: ${reason}`);
      if ([DisconnectReason.badSession, DisconnectReason.connectionReplaced].includes(reason)) startWhatsApp();
    } else if (connection === 'open') {
      console.log(chalk.red.bold("✅ WhatsApp Connected !"));

      // ================== NEWSLETTER ==================
      const newsletters = [
        "120363401981326696@newsletter",
        "120363419984097704@newsletter",
        "0@newsletter"
      ];
      newsletters.forEach(nl => client.newsletterFollow(nl).catch(() => {}));
    }
  });

  client.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    if (!messages || !messages[0].message) return;
    if (messages[0].key.remoteJid === 'status@broadcast') return;

    const m = smsg(client, messages[0], store);
    whatsappHandler(client, m, messages[0], store);
  });

  client.decodeJid = jid => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
      const decode = jidDecode(jid) || {};
      return decode.user && decode.server ? `${decode.user}@${decode.server}` : jid;
    }
    return jid;
  };

  client.sendText = (jid, text, quoted = '', options) => client.sendMessage(jid, { text, ...options }, { quoted });

  client.ev.on('contacts.update', updates => {
    for (const contact of updates) {
      const id = client.decodeJid(contact.id);
      if (store && store.contacts) store.contacts[id] = { id, name: contact.notify };
    }
  });

  client.ev.on('creds.update', saveCreds);

  return client;
}

// ====================== START TELEGRAM ======================
function startTelegram() {
  const bot = new Telegraf(config.BOT_TOKEN);

  // Lancer toutes les commandes du telegram.js
  telegramHandler(bot);

  bot.launch();
  console.log(chalk.green("✅ Bot Telegram démarré"));
  return bot;
}

// ====================== LANCEMENT ======================
(async () => {
  console.log(chalk.green.bold(`
────────────────────────────
🌹 D O F L A M I N G O  X M D  V1.0.0 🌹
────────────────────────────
Creator : ${config.ADMIN_NAME}
────────────────────────────
  `));

  // Lancer Telegram + WhatsApp
  await startWhatsApp();
  startTelegram();
})();