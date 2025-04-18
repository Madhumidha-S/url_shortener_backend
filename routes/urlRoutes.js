const express = require("express");
const router = express.Router();
const urlController = require("../controllers/urlController.js");
const fs = require("fs");

router.post("/shorturl", urlController.generateURL);
router.delete("/delete/:delete_id", urlController.deleteURL);
router.get("/analytics/:shortID", urlController.getAnalytics);
router.get("/history", urlController.getHistory);
module.exports = router;
