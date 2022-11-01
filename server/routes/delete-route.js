const express = require('express');
const scanController = require('../controller/delete-controller');

const router = express.Router();

router.get('/delete-mission/:mission', scanController.getScanData);

module.exports = router;