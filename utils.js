export function isPremium(user){
  if(!user) return false;
  if(!user.premium) return false;
  if(user.expire_at && new Date() > new Date(user.expire_at)) return false;
  return true;
}

export async function resolveTarget(arg, ctx, bot){
  try{
    if(!arg || arg === "") return { ok: true, id: ctx.from.id };
    arg = arg.toString().trim();

    if(/^\d+$/.test(arg)) return { ok: true, id: parseInt(arg) };

    const linkMatch = arg.match(/(?:t\.me|telegram\.me)\/([\w\d_]+)/i);
    if(linkMatch) arg = '@' + linkMatch[1];

    if(arg.startsWith('@')){
      try{ const chat = await bot.telegram.getChat(arg); return { ok: true, id: chat.id }; }
      catch(e){ return { ok: false, error: "Impossible de récupérer l'utilisateur depuis le username." }; }
    }

    return { ok:false, error:"Format d'identifiant non reconnu."};
  }catch(err){ return { ok:false, error:"Erreur résolution target: "+err.message }; }
}