// telegram.js
import config from './system/config.js';
import { Users } from './system/db.js';
import { createPteroUser, createPteroServer } from './system/ptero.js';
import { isPremium, resolveTarget } from './system/utils.js';

export default function telegramHandler(bot) {

  // ================== /start ==================
  bot.start(async ctx => {
    const msg = `
👋 Bienvenue sur le Cpanel Bot!

🎯 Commandes disponibles (Premium/Admin) :
/my_id - Voir ton ID Telegram
/addpanel - Créer un panel Pterodactyl
/c-panel - Créer un compte + panel
/add_prem - Ajouter un utilisateur Premium (admin)
/d-panel - Supprimer les panels d'un utilisateur (admin)
/add_server - Ajouter un serveur (admin)
/buy_premium - Contact pour devenir Premium

${config.SITES_REF}
💻 Admin: ID ${config.ADMIN_ID}
📢 Publicité Adsterra: ${config.ADSTERA_LINK}

📞 Contact Admin :
- Telegram: ${config.CONTACT_ADMIN.telegram}
- WhatsApp: ${config.CONTACT_ADMIN.whatsapp}
`;
    try { await ctx.replyWithPhoto({ url: config.MENU_IMG }, { caption: msg }); }
    catch { ctx.reply(msg); }
  });

  // ================== /my_id ==================
  bot.command('my_id', ctx => ctx.reply(`📌 Ton Telegram ID: ${ctx.from.id}`));

  // ================== /addpanel ==================
  bot.command('addpanel', async ctx => {
    const args = ctx.message.text.split(' ').slice(1);
    const usernamePtero = args[0];
    if (!usernamePtero) return ctx.reply("⚠️ Usage: /addpanel <username_pterodactyl> [targetId|@username]");

    const maybeTarget = args[1];
    const resolved = await resolveTarget(maybeTarget, ctx, bot);
    if (!resolved.ok) return ctx.reply(`❌ ${resolved.error}`);
    const targetId = resolved.id;

    let user = await Users.findOne({ telegram_id: targetId });
    if (!user) return ctx.reply("❌ Utilisateur non trouvé.");

    const callerId = ctx.from.id;
    if (callerId !== config.ADMIN_ID && !isPremium(user)) return ctx.reply("❌ Action réservée aux Premium/Admin.");
    if (user.panels_used >= user.panels_limit && callerId !== config.ADMIN_ID) return ctx.reply("❌ Limite de panels atteinte.");

    try {
      const email = `${usernamePtero}@example.com`;
      const pteroUserId = await createPteroUser(usernamePtero, "password123", email);
      const serverId = await createPteroServer(pteroUserId, usernamePtero);

      user.panels_used += 1; await user.save();

      const replyText = `✅ Panel créé !
Panel: ${usernamePtero}
Panel ID: ${serverId}
RAM: ${config.PANEL_DEFAULT_RAM === 0 ? "UNLI" : config.PANEL_DEFAULT_RAM}MB
CPU: ${config.PANEL_DEFAULT_CPU}%`;

      try { await bot.telegram.sendPhoto(targetId, { url: config.MENU_IMG }, { caption: replyText }); }
      catch { return ctx.reply(`✅ Panel créé mais impossible d'envoyer à l'utilisateur (${targetId}).`); }

      if (callerId !== targetId) await ctx.reply(`✅ Panel créé et envoyé à l'utilisateur (${targetId}).`);
      else await ctx.reply(`✅ Panel créé pour toi (${usernamePtero}).`);
    } catch (err) {
      ctx.reply(`❌ Erreur: ${err.response?.data || err.message}`);
    }
  });

  // ================== /c-panel ==================
  bot.command('c-panel', async ctx => {
    const args = ctx.message.text.split(' ').slice(1).join(' ').split('|');
    if (args.length < 3) return ctx.reply("⚠️ Usage: /c-panel user|password|panel_name [targetId|@username]");

    const [username, password, panelName] = args;
    const maybeTarget = args[3] || null;
    const resolved = await resolveTarget(maybeTarget, ctx, bot);
    if (!resolved.ok) return ctx.reply(`❌ ${resolved.error}`);
    const targetId = resolved.id;

    let user = await Users.findOne({ telegram_id: targetId });
    if (!user) return ctx.reply("❌ Utilisateur non trouvé.");

    const callerId = ctx.from.id;
    if (callerId !== config.ADMIN_ID && !isPremium(user)) return ctx.reply("❌ Action réservée aux Premium/Admin.");

    try {
      const pteroUserId = await createPteroUser(username, password, `${username}@example.com`);
      const serverId = await createPteroServer(pteroUserId, panelName);

      if (callerId !== config.ADMIN_ID) {
        user.panels_used += 1;
        await user.save();
      }

      const replyText = `✅ Compte + Panel créé !
Utilisateur: ${username}
Panel: ${panelName}
Server ID: ${serverId}`;

      try { await bot.telegram.sendPhoto(targetId, { url: config.MENU_IMG }, { caption: replyText }); }
      catch { return ctx.reply(`✅ Panel créé mais impossible d'envoyer à l'utilisateur (${targetId}).`); }

      if (callerId !== targetId) await ctx.reply(`✅ Panel créé et envoyé à l'utilisateur (${targetId}).`);
      else await ctx.reply(`✅ Panel créé pour toi (${panelName}).`);

    } catch (err) {
      ctx.reply(`❌ Erreur: ${err.response?.data || err.message}`);
    }
  });

  // ================== /add_prem ==================
  bot.command('add_prem', async ctx => {
    if (ctx.from.id !== config.ADMIN_ID) return ctx.reply("❌ Seulement admin.");

    const args = ctx.message.text.split(' ').slice(1);
    if (!args[0]) return ctx.reply("⚠️ Usage: /add_prem <telegram_id>");

    const resolved = await resolveTarget(args[0], ctx, bot);
    if (!resolved.ok) return ctx.reply(`❌ ${resolved.error}`);
    const targetId = resolved.id;

    let user = await Users.findOne({ telegram_id: targetId });
    if (!user) {
      user = new Users({ telegram_id: targetId, premium: true, panels_limit: 5, expire_at: new Date(new Date().getTime() + 30*24*60*60*1000) });
      await user.save();
    } else {
      user.premium = true;
      user.expire_at = new Date(new Date().getTime() + 30*24*60*60*1000);
      await user.save();
    }

    ctx.reply(`✅ Utilisateur (${targetId}) ajouté en Premium pour 1 mois.`);
  });

  // ================== /d-panel ==================
  bot.command('d-panel', async ctx => {
    if (ctx.from.id !== config.ADMIN_ID) return ctx.reply("❌ Seulement admin.");

    const args = ctx.message.text.split(' ').slice(1);
    if (!args[0]) return ctx.reply("⚠️ Usage: /d-panel <telegram_id>");

    const resolved = await resolveTarget(args[0], ctx, bot);
    if (!resolved.ok) return ctx.reply(`❌ ${resolved.error}`);
    const targetId = resolved.id;

    let user = await Users.findOne({ telegram_id: targetId });
    if (!user) return ctx.reply("❌ Utilisateur non trouvé.");

    user.panels_used = 0;
    await user.save();

    ctx.reply(`✅ Tous les panels de l'utilisateur (${targetId}) ont été réinitialisés.`);
  });

  // ================== /add_server ==================
  bot.command('add_server', async ctx => {
    if (ctx.from.id !== config.ADMIN_ID) return ctx.reply("❌ Seulement admin.");

    const args = ctx.message.text.split(' ').slice(1);
    if (!args[0] || !args[1]) return ctx.reply("⚠️ Usage: /add_server <username_pterodactyl> <panel_name>");

    const [usernamePtero, panelName] = args;

    try {
      const pteroUserId = await createPteroUser(usernamePtero, "password123", `${usernamePtero}@example.com`);
      const serverId = await createPteroServer(pteroUserId, panelName);
      ctx.reply(`✅ Serveur ajouté pour ${usernamePtero} avec ID ${serverId}`);
    } catch(err) {
      ctx.reply(`❌ Erreur: ${err.response?.data || err.message}`);
    }
  });

  // ================== /buy_premium ==================
  bot.command('buy_premium', ctx => {
    ctx.reply(`⚠️ Cette commande est réservée aux administrateurs ou aux utilisateurs Premium.
Pour devenir Premium, contacte directement l'admin :

📞 Telegram: ${config.CONTACT_ADMIN.telegram}
📞 WhatsApp: ${config.CONTACT_ADMIN.whatsapp}`);
  });

  console.log("✅ Telegram handler chargé !");
}