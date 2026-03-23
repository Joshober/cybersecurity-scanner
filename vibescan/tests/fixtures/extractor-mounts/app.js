import express from "express";

const app = express();
const api = express.Router();
const v1 = express.Router();

app.use("/api", api);
api.use("/v1", v1);

api.use((req, res, next) => next());
v1.get("/users/:id", (req, res) => {
  res.send(req.query.q + req.body.name);
});

export default app;
