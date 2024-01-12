
const io = require("../server").io;
const express = require("express");
const router = express.Router();

const { handleTemperatureRequest } = require("../controllers/socketController");



module.exports = router;
