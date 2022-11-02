const express = require('express');
const deleteController = require('../controller/delete-controller');

const router = express.Router();

router.post('/delete-mission/:mission', deleteController.deleteMission);
router.post('/delete-mission/:mission/:session', deleteController.deleteSession);

module.exports = router;