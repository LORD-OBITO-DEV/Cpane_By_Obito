import mongoose from "mongoose";
import config from "./system/config.js";  // ← notre config.js

const uri = config.MONGO_URI;

if (!uri) {
  throw new Error("⚠️ MONGO_URI n'est pas défini dans config.js !");
}

export const connectDB = async () => {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("✅ MongoDB connectée !");
  } catch (err) {
    console.error("❌ Erreur de connexion MongoDB :", err);
    process.exit(1);
  }
};

connectDB();