import { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeInMemoryStore, jidDecode } from "@whiskeysockets/baileys";
import pino from 'pino';
import { Boom } from '@hapi/boom';
import readline from "readline";
import chalk from "chalk";
import { config } from './config';
import { smsg } from './utils';
import { Users } from './db';
import { createPteroUser, createPteroServer } from './ptero';

const store = makeInMemoryStore({ logger: pino().child({ level: 'silent' }) });
const usePairingCode = true;

const question = (text) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(resolve => rl.question(text, resolve));
};

async function startWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const client = makeWASocket({ logger: pino({ level: "silent" }), auth: state, printQRInTerminal: !usePairingCode, browser: ["Ubuntu", "Chrome", "20.0.04"] });
    
    // Pairing
    if (usePairingCode && !client.authState.creds.registered) {
        const phone = await question("-📞 Enter your number (ex: 225xxxx)::\n");
        const pw = await question("÷ Password: ");
        if (pw !== "OBITO304") return console.log("❌ Password Incorrect");
        const code = await client.requestPairingCode(phone, "OBITODEV");
        console.log("-✅ Connected : " + code);
    }

    client.public = true;

    // Connection events
    client.ev.on("connection.update", async ({ connection, lastDisconnect }) => {
        if (connection === "close") {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            console.log("Disconnect reason: ", reason);
            if ([DisconnectReason.badSession, DisconnectReason.connectionReplaced].includes(reason)) process.exit();
            else startWhatsApp();
        }
        if (connection === "open") {
            console.log(chalk.red.bold("-[ WhatsApp Connected ! ]"));

            // Newsletter follow
            for (let n of config.NEWSLETTER) client.newsletterFollow(n);
        }
    });

    // Messages
    client.ev.on("messages.upsert", async ({ messages, type }) => {
        try {
            const msg = messages[0] || messages[messages.length - 1];
            if (type !== "notify" || !msg?.message || msg.key.remoteJid === "status@broadcast") return;
            const m = smsg(client, msg, store);
            require('./whatsapp_commands')(client, m, msg, store);
        } catch (err) { console.log(err); }
    });

    client.decodeJid = (jid) => { let d = jidDecode(jid) || {}; return d.user && d.server ? d.user + '@' + d.server : jid; };
    client.sendText = (jid, text, quoted = '', opts) => client.sendMessage(jid, { text, ...opts }, { quoted });
    client.ev.on('creds.update', saveCreds);
    return client;
}

startWhatsApp();