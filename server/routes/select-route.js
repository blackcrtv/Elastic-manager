const express = require('express');
const selectController = require('../controller/select-controller');

const router = express.Router();

router.get('/mission', selectController.getMissions);
router.get('/session/:mission', selectController.getSessions);

module.exports = router;