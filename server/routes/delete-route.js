const express = require('express');
const deleteController = require('../controller/delete-controller');

const router = express.Router();

router.get('/delete-mission/:mission', deleteController.deleteMission);

module.exports = router;