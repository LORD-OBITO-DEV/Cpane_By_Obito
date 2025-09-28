import mongoose from "mongoose";
import 'dotenv/config';

const uri = process.env.MONGO_URI;

if (!uri) {
  throw new Error("⚠️  MONGO_URI n'est pas défini dans les variables d'environnement !");
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