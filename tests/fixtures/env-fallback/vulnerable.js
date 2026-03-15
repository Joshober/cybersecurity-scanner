// Should trigger: crypto.secrets.env-fallback
const jwtSecret = process.env.JWT_SECRET || "devsecret";
const apiKey = process.env.API_KEY || "default-key";
