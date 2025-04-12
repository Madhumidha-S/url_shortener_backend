const express = require("express");
const urlRoutes = require("./urlRoutes");

const router = express.Router();

router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

router.use("/api", urlRoutes);

module.exports = router;
