import express from "express";
import helmet from "helmet";

const app = express();
app.use(helmet());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

export default app;
