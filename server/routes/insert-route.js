const express = require('express');
const insertController = require('../controller/insert-controller');

const router = express.Router();

router.post('/insert-mission/:mission', insertController.insertMission);
router.post('/insert-session/:mission/:session', insertController.insertSession);

module.exports = router;