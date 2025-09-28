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