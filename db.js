import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error("⚠️  MONGO_URI n'est pas défini dans les variables d'environnement !");
}

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

export const Users = mongoose.model("Users", new mongoose.Schema({
  telegram_id: { type: String, required: true, unique: true },
  premium: { type: Boolean, default: false },
  expire_at: { type: Date, default: null },
  panels_used: { type: Number, default: 0 },
  panels_limit: { type: Number, default: 1 },
}));