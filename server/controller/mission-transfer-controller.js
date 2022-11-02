const { } = require("../../database/elastic");
const { ES, errorLogFile, auditFile } = require('../../conf.json');
const { insertLog } = require('../../Logs/Script/formatLogs');

const exportMission = async (req, res, next) => {
    const mission = req.params.mission;
    let { user, role, token } = req.body;
    try {
        res.json({
        });
    } catch (error) {
        insertLog(error, errorLogFile);
        res.json({
            "error": "Error exportMission: " + error.msg ?? error
        });
    }

}

const importMission = async (req, res, next) => {
    const mission = req.params.mission;
    let { user, role, token } = req.body;
    try {
        res.json({
        });
    } catch (error) {
        insertLog(error, errorLogFile);
        res.json({
            "error": "Error importMission: " + error.msg ?? error
        });
    }

}

module.exports = {
    exportMission,
    importMission
}