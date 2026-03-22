const express = require("express");
const router = express.Router();
const { getStastics } = require("../controllers/stastic.controller");

router.route("/").get(getStastics);

module.exports = router;
