const express = require('express');
const transferController = require('../controller/mission-transfer-controller');

const router = express.Router();

router.post('/export-mission/:mission', transferController.exportMission);
router.post('/import-mission/:mission', transferController.importMission);

module.exports = router;