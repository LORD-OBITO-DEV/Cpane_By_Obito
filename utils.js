import { Users } from "./db.js";

// Vérifie si l'utilisateur est premium et actif
export async function isPremium(telegramId) {
  const user = await Users.findOne({ telegram_id: telegramId });
  if (!user) return false;
  if (user.premium && user.expire_at && user.expire_at < new Date()) return false;
  return user.premium;
}

// Vérifie si l'utilisateur peut créer un panel
export async function canCreatePanel(telegramId) {
  const user = await Users.findOne({ telegram_id: telegramId });
  if (!user) return false;
  return user.panels_used < user.panels_limit;
}

// Détermine la cible (id Telegram ou username ou celui qui exécute)
export function resolveTarget(ctx) {
  // Si l'utilisateur répond à un message
  if (ctx.message?.reply_to_message?.from?.id) {
    return ctx.message.reply_to_message.from.id;
  }

  // Si un argument est fourni (ex: /c-panel user|pass ...)
  if (ctx.message?.text) {
    const parts = ctx.message.text.split(" ");
    if (parts.length > 1) {
      return parts[1]; // retourne le premier argument après la commande
    }
  }

  // Par défaut → l’utilisateur actuel
  return ctx.from.id;
}