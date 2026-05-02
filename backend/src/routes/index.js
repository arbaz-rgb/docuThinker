const express = require("express");
const aiRoutes = require("./ai.routes");
const authRoutes = require("./auth.routes");
const documentRoutes = require("./document.routes");

const router = express.Router();

router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    service: "DocuThinker API",
    status: "healthy",
  });
});

router.use("/auth", authRoutes);
router.use("/ai", aiRoutes);
router.use("/documents", documentRoutes);

module.exports = router;
