const {  } = require("../../database/elastic");
const { ES, errorLogFile, logFile } = require('../../conf.json');
const { insertLog } = require('../../Logs/formatLogs');

const deleteMission = async (req, res, next) => {
    const mission = req.params.mission;
    if (!mission) {
        throw {
            error: true,
            msg: 'Mission param cant be null!',
            errorStatus: 4
        }
    }
    try {

        res.json({});
    } catch (error) {
        insertLog(error, errorLogFile);
        res.json({
            "error": "Error " + error
        });
    }

}

module.exports = {
    deleteMission
}