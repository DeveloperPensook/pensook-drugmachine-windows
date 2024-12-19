const express = require("express");
const router = express.Router();
const stockLedgerService = require("../services/stockLedgerServices");

router.post("/insertIdCard", async (req, res) => {
  try {
    const result = await stockLedgerService.insertIdCard(req);
    res.status(201).json({ response: result, session: req.session });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/removeIdCard", async (req, res) => {
  try {
    const result = await stockLedgerService.removeIdCard(req);
    res.status(201).json({ response: result, session: req.session });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
