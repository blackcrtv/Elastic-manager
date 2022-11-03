const express = require('express');
const deleteController = require('../controller/delete-controller');

const router = express.Router();

router.delete('/delete-mission/:mission', deleteController.deleteMission);
router.delete('/delete-mission/:mission/:session', deleteController.deleteSession);

module.exports = router;