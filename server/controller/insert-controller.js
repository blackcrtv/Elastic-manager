const { } = require("../../database/elastic");
const { ES, errorLogFile, auditFile } = require('../../conf.json');
const { insertLog } = require('../../Logs/Script/formatLogs');

const insertMission = async (req, res, next) => {
    const mission = req.params.mission;
    let { user, role, token } = req.body;
    try {
        res.json({
        });
    } catch (error) {
        insertLog(error, errorLogFile);
        res.json({
            "error": "Error insertMission: " + error.msg ?? error
        });
    }

}

const insertSession = async (req, res, next) => {
    const mission = req.params.mission;
    let { user, role, token } = req.body;
    try {
        res.json({
        });
    } catch (error) {
        insertLog(error, errorLogFile);
        res.json({
            "error": "Error insertSession: " + error.msg ?? error
        });
    }

}

module.exports = {
    insertMission,
    insertSession
}