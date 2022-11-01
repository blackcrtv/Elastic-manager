const { deleteKeyElastic } = require("../../database/elastic");
const { ES, errorLogFile, logFile } = require('../../conf.json');
const { insertLog } = require('../../Logs/formatLogs');

const deleteMission = async (req, res, next) => {
    const mission = req.params.mission;
    try {
        if (!mission) {
            throw {
                error: true,
                msg: 'Mission param cant be null!',
                errorStatus: 4
            }
        }
        let responseDelete = await deleteKeyElastic("mission.keyword", mission, ES.INDEX_MISIUNI);
        res.json(responseDelete);
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