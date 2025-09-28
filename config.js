import 'dotenv/config';

export default {
  BOT_TOKEN: process.env.BOT_TOKEN,
  ADMIN_ID: Number(process.env.ADMIN_ID),
  USE_WHATSAPP: process.env.USE_WHATSAPP === 'true',
  ADMIN_NUMBER: process.env.ADMIN_NUMBER,

  PTERO_URL: process.env.PTERO_URL,
  PTERO_API_KEY: process.env.PTERO_API_KEY,
  NEST_ID: Number(process.env.NEST_ID),
  EGG_ID: Number(process.env.EGG_ID),
  PANEL_DEFAULT_RAM: Number(process.env.PANEL_DEFAULT_RAM),
  PANEL_DEFAULT_CPU: Number(process.env.PANEL_DEFAULT_CPU),
  PANEL_DEFAULT_DISK: Number(process.env.PANEL_DEFAULT_DISK),

  ADSTERA_LINK: process.env.ADSTERA_LINK,
  MENU_IMG: process.env.MENU_IMG,

  CONTACT_ADMIN: {
    telegram: process.env.CONTACT_ADMIN_TELEGRAM,
    whatsapp: process.env.CONTACT_ADMIN_WHATSAPP,
    phone: process.env.CONTACT_ADMIN_PHONE
  },

  MONGO_URI: process.env.MONGO_URI,

  NEWSLETTER: [
    "120363401981326696@newsletter",
    "120363419984097704@newsletter"
  ],

  SITES_REF: `
🌐 Nos sites :
- https://blackhatvps.store
- https://panel.blackhatvps.store
- https://site3.com
`
};