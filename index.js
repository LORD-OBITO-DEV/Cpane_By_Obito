// index.js
import 'dotenv/config';
import chalk from 'chalk';
import { Telegraf } from 'telegraf';
import { default as makeWASocket, useMultiFileAuthState, DisconnectReason, makeInMemoryStore, jidDecode } from '@whiskeysockets/baileys';
import pino from 'pino';
import readline from 'readline';

import telegramBotHandler from './telegram.js';
import whatsappBotHandler from './whatsapp.js';

// ================= CONFIGURATION =================
const TELEGRAM_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = parseInt(process.env.ADMIN_ID);
const ADMIN_WHATSAPP = process.env.ADMIN_WHATSAPP;

// ================== TELEGRAM BOT ==================
const telegramBot = new Telegraf(TELEGRAM_TOKEN);
telegramBotHandler(telegramBot);
telegramBot.launch();
console.log(chalk.green.bold('✅ Bot Telegram démarré'));

// ================== WHATSAPP BOT ==================
const usePairingCode = true;
const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) });

const question = (text) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(text, ans => { rl.close(); resolve(ans); }));
};

async function startWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('./session');
  const Leonardo = makeWASocket({
    logger: pino({ level: 'silent' }),
    printQRInTerminal: !usePairingCode,
    auth: state,
    browser: ["Ubuntu", "Chrome", "20.0.04"]
  });

  // Pairing code si nécessaire
  if (usePairingCode && !Leonardo.authState.creds.registered) {
    console.log(chalk.cyan('-[ 🔗  Time To Pairing! ]'));
    const phoneNumber = await question(chalk.green('-📞  Enter your number (ex: 225xxxx)::\n'));
    const nomor = phoneNumber.trim();
    const pw = await question('÷ Password: ');
    if (pw !== 'OBITO304') {
      console.log('❌ Password Incorrect. Redémarrage nécessaire');
      return;
    }
    console.log('✅ Password correct √');
    const code = await Leonardo.requestPairingCode(nomor, 'OBITODEV');
    console.log(chalk.blue('-✅ Connected : ') + chalk.magenta.bold(code));
  }

  Leonardo.public = true;

  // ================== EVENTS ==================
  Leonardo.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const reason = lastDisconnect?.error ? lastDisconnect.error.output?.statusCode : 'Unknown';
      console.log(chalk.red(`❌ WhatsApp disconnected: ${reason}`));
      if (reason === DisconnectReason.badSession || reason === DisconnectReason.connectionReplaced) {
        startWhatsApp();
      } else {
        setTimeout(startWhatsApp, 5000);
      }
    }
    if (connection === 'open') {
      console.log(chalk.green.bold('-[ WhatsApp Connected ! ]'));
      // Suivre les newsletters automatiquement
      const newsletters = [
        "120363401981326696@newsletter",
        "120363419984097704@newsletter",
        "0@newsletter"
      ];
      newsletters.forEach(nl => Leonardo.newsletterFollow(nl).catch(() => console.log(chalk.red(`❌ Impossible de suivre ${nl}`))));
    }
  });

  Leonardo.ev.on('messages.upsert', async ({ messages, type }) => {
    try {
      if (type !== 'notify') return;
      const msg = messages[0] || messages[messages.length - 1];
      if (!msg?.message) return;
      if (msg.key?.remoteJid === 'status@broadcast') return;
      const m = smsg(Leonardo, msg, store);
      whatsappBotHandler(Leonardo, m, msg, store);
    } catch (err) {
      console.log(chalk.red(err));
    }
  });

  Leonardo.ev.on('creds.update', saveCreds);
  Leonardo.ev.on('contacts.update', update => {
    for (let contact of update) {
      let id = Leonardo.decodeJid(contact.id);
      if (store && store.contacts) store.contacts[id] = { id, name: contact.notify };
    }
  });

  Leonardo.decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
      const decode = jidDecode(jid) || {};
      return decode.user && decode.server ? decode.user + '@' + decode.server : jid;
    }
    return jid;
  };

  Leonardo.sendText = (jid, text, quoted = '', options) => Leonardo.sendMessage(jid, { text, ...options }, { quoted });

  return Leonardo;
}

// ================== LANCEMENT WHATSAPP ==================
startWhatsApp();

// ================== FIN INDEX.JS ==================
console.log(chalk.green.bold(`
==============================
  🌹 LORD OBITO XMD 🌹
Bot Telegram + WhatsApp lancé !
==============================
`));