import mongoose from 'mongoose';
import config from './config.js';

mongoose.connect(config.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.log("❌ MongoDB error", err));

const userSchema = new mongoose.Schema({
  telegram_id: Number,
  username: String,
  premium: { type: Boolean, default: false },
  panels_used: { type: Number, default: 0 },
  panels_limit: { type: Number, default: 5 },
  expire_at: Date,
});

export const Users = mongoose.model('Users', userSchema);