import mongoose from "mongoose";

await mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const userSchema = new mongoose.Schema({
  telegram_id: String,
  premium: { type: Boolean, default: false },
  expire_at: Date, // date d'expiration du statut premium
  panels_used: { type: Number, default: 0 },
  panels_limit: { type: Number, default: 5 }
});

export const Users = mongoose.model("Users", userSchema);