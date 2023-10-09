const express = require("express");
const router = express.Router();
const stockLedgerService = require("../services/stockLedgerServices");

router.post("/drugMachineModbus", async (req, res) => {
  try {
    const result = await stockLedgerService.drugMachineModbus(req);
    res.status(201).json({ response: result, session: req.session });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/getStatusModbus", async (req, res) => {
  try {
    const result = await stockLedgerService.getStatusModbus(req);
    res.status(201).json({ response: result, session: req.session });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
