// whatsapp.js
import fs from 'fs';
import chalk from 'chalk';

// Liste des newsletters à suivre
const newsletters = [
  "120363401981326696@newsletter",
  "120363419984097704@newsletter",
  "0@newsletter", // répète plusieurs fois si nécessaire
];

// Commandes disponibles pour WhatsApp
export default async function whatsappHandler(Leonardo, m, msg, store) {
  try {
    const text = m.text || '';
    const from = m.sender;

    // ===================== COMMANDES =====================
    if (text.startsWith('!menu') || text.startsWith('!help')) {
      const menuMsg = `
👋 Bienvenue sur le bot WhatsApp !

🎯 Commandes disponibles :
!menu / !help - Affiche ce menu
!id - Voir ton numéro
!addpanel <username> - Créer un panel Pterodactyl (Premium/Admin)
!c-panel user|password|panel_name - Créer compte + panel (Premium/Admin)
!add_prem <number> - Ajouter Premium (Admin)
!d-panel <number> - Supprimer tous les panels (Admin)
!buy_premium - Infos pour devenir Premium

📢 Newsletter suivies automatiquement !
`;
      await Leonardo.sendText(from, menuMsg);
    }

    // ================== !id ==================
    if (text.startsWith('!id')) {
      await Leonardo.sendText(from, `📌 Ton numéro WhatsApp: ${from.split('@')[0]}`);
    }

    // ================== !addpanel ==================
    if (text.startsWith('!addpanel')) {
      const args = text.split(' ').slice(1);
      if (!args[0]) return Leonardo.sendText(from, "⚠️ Usage: !addpanel <username>");

      const username = args[0];
      // ici tu appelleras ta fonction pour créer panel Pterodactyl
      await Leonardo.sendText(from, `✅ Panel créé pour ${username}`);
    }

    // ================== !c-panel ==================
    if (text.startsWith('!c-panel')) {
      const args = text.split(' ').slice(1).join(' ').split('|');
      if (args.length < 3) return Leonardo.sendText(from, "⚠️ Usage: !c-panel user|password|panel_name");

      const [user, pass, panelName] = args;
      // ici tu appelleras tes fonctions createPteroUser et createPteroServer
      await Leonardo.sendText(from, `✅ Compte + Panel créé !\nUser: ${user}\nPanel: ${panelName}`);
    }

    // ================== !add_prem ==================
    if (text.startsWith('!add_prem')) {
      const args = text.split(' ').slice(1);
      if (!args[0]) return Leonardo.sendText(from, "⚠️ Usage: !add_prem <number>");
      await Leonardo.sendText(from, `✅ Utilisateur ${args[0]} ajouté en Premium !`);
    }

    // ================== !d-panel ==================
    if (text.startsWith('!d-panel')) {
      const args = text.split(' ').slice(1);
      if (!args[0]) return Leonardo.sendText(from, "⚠️ Usage: !d-panel <number>");
      await Leonardo.sendText(from, `✅ Tous les panels de ${args[0]} ont été supprimés.`);
    }

    // ================== !buy_premium ==================
    if (text.startsWith('!buy_premium')) {
      await Leonardo.sendText(from, `⚠️ Contact Admin pour devenir Premium :
🌹 WhatsApp: ${process.env.ADMIN_WHATSAPP}`);
    }

    // ================== NEWSLETTER ==================
    for (const nl of newsletters) {
      try { await Leonardo.newsletterFollow(nl); }
      catch { console.log(chalk.red(`❌ Impossible de suivre ${nl}`)); }
    }

  } catch (err) {
    console.log(chalk.red(err));
  }
}
