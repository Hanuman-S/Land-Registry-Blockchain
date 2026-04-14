const express = require("express");
const router = express.Router();

const controller = require("../controllers/registryController");

router.get("/search", controller.searchProperty);
router.post("/transfer", controller.transferProperty);
router.get("/verify", controller.verifyBlockchain);

module.exports = router;