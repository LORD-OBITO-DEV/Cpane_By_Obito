import { Telegraf } from "telegraf";
import { Users } from "./db.js";
import { isPremium, canCreatePanel } from "./utils.js";
import { createPteroUser, createPteroServer } from "./ptero.js";
import { config } from "./config.js";

const bot = new Telegraf(process.env.BOT_TOKEN);

// Commande /start
bot.start(ctx => {
  ctx.replyWithPhoto(
    { url: config.MENU_IMG },
    { caption: `
👋 Bienvenue sur le Cpanel Bot!
🎯 Commandes:
/my_id
/addpanel
/c-panel
/add_prem
/d-panel
/add_server

📞 Contact Admin: ${config.CONTACT_ADMIN.telegram}
📢 Pubs: ${config.ADSTERA_LINK}` }
  );
});

// /add_prem
bot.command("add_prem", async ctx => {
  const args = ctx.message.text.split(" ").slice(1);
  const targetId = args[0];
  if(ctx.from.id != config.ADMIN_NUMBER) return ctx.reply("❌ Commande réservée à l'admin");
  if(!targetId) return ctx.reply("⚠️ ID Telegram manquant");

  const expireDate = new Date();
  expireDate.setMonth(expireDate.getMonth()+1);

  await Users.updateOne(
    { telegram_id: targetId },
    { telegram_id: targetId, premium: true, expire_at: expireDate },
    { upsert: true }
  );

  ctx.reply(`✅ L'utilisateur ${targetId} est premium jusqu'au ${expireDate.toLocaleDateString()}`);
});

// /c-panel
bot.command("c-panel", async ctx => {
  const args = ctx.message.text.split(" ").slice(1).join(" ").split("|");
  if(args.length < 4) return ctx.reply("❌ Format: /c-panel user|password|panel_name|id_telegram");

  const [username, password, panelName, telegramId] = args;
  if(ctx.from.id != config.ADMIN_NUMBER && !(await isPremium(ctx.from.id))) return ctx.reply("⚠️ Commande réservée à l'admin ou premium");

  const userId = await createPteroUser(username, password, `${username}@mail.com`);
  const serverId = await createPteroServer(userId, panelName);

  await Users.updateOne(
    { telegram_id: telegramId },
    { $inc: { panels_used: 1 } },
    { upsert: true }
  );

  ctx.reply(`✅ Panel créé pour ${telegramId}\nUser ID: ${userId}\nServer ID: ${serverId}`);
});

// /addpanel
bot.command("addpanel", async ctx => {
  const args = ctx.message.text.split(" ").slice(1);
  const telegramId = args[0] || ctx.from.id;

  const user = await Users.findOne({ telegram_id: telegramId });
  if(!user) return ctx.reply("❌ L'utilisateur n'existe pas ou n'est pas premium");
  if(!(await canCreatePanel(telegramId))) return ctx.reply("⚠️ Limite de panels atteinte (5 max)");

  const panelName = `panel_${user.panels_used + 1}`;
  const serverId = await createPteroServer(user.telegram_id, panelName);

  await Users.updateOne(
    { telegram_id: telegramId },
    { $inc: { panels_used: 1 } }
  );

  ctx.reply(`✅ Nouveau panel créé pour ${telegramId}\nServer ID: ${serverId}`);
});

// /d-panel
bot.command("d-panel", async ctx => {
  if(ctx.from.id != config.ADMIN_NUMBER) return ctx.reply("❌ Commande réservée à l'admin");

  const args = ctx.message.text.split(" ").slice(1);
  const telegramId = args[0];
  if(!telegramId) return ctx.reply("⚠️ ID manquant");

  // Ici suppression via Ptero API (à implémenter)
  await Users.updateOne(
    { telegram_id: telegramId },
    { $inc: { panels_used: -1 } }
  );

  ctx.reply(`✅ Panel supprimé pour ${telegramId}`);
});

// /add_server
bot.command("add_server", async ctx => {
  if(ctx.from.id != config.ADMIN_NUMBER) return ctx.reply("❌ Commande réservée à l'admin");
  const args = ctx.message.text.split(" ").slice(1);
  const telegramId = args[0];
  if(!telegramId) return ctx.reply("⚠️ ID manquant");

  const user = await Users.findOne({ telegram_id: telegramId });
  if(!user) return ctx.reply("❌ L'utilisateur n'existe pas");

  const panelName = `panel_${user.panels_used + 1}`;
  const serverId = await createPteroServer(user.telegram_id, panelName);

  await Users.updateOne({ telegram_id: telegramId }, { $inc: { panels_used: 1 } });

  ctx.reply(`✅ Serveur ajouté pour ${telegramId}\nServer ID: ${serverId}`);
});

bot.launch();