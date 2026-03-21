// Should trigger: SEC-004 (weak env fallback literal)
const jwtSecret = process.env.JWT_SECRET || "devsecret";
const apiKey = process.env.API_KEY || "default-key";
