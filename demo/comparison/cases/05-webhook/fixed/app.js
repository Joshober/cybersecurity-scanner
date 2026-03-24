const express = require("express");
const stripe = require("stripe")("sk_test_placeholder");

const app = express();

app.post("/webhook", express.raw({ type: "application/json" }), (req, res) => {
  stripe.webhooks.constructEvent(req.body, req.headers["stripe-signature"], "whsec_test_placeholder");
  res.send("ok");
});

module.exports = { app };
