const { deleteKeyElastic, deleteCatchData } = require("../../database/elastic");
const { ES, errorLogFile, auditFile } = require('../../conf.json');
const { insertLog } = require('../../Logs/formatLogs');

const deleteMission = async (req, res, next) => {
    const mission = req.params.mission;
    let { user, role, token } = req.body;
    let messageAudit = `${user} deleted mission ${mission};`;
    try {
        if (!mission) {
            throw {
                error: true,
                msg: 'Mission param cant be null!',
                errorStatus: 4
            }
        }
        let responseDeleteMission = await deleteKeyElastic("misiune.keyword", mission, ES.INDEX_MISIUNI);
        let responseDeleteSession = await deleteKeyElastic("misiune_apartinatoare.keyword", mission, ES.INDEX_SESIUNI);
        let responseDeleteCatch = await deleteCatchData(mission);
        // insertLog(messageAudit, auditFile);
        res.json({
            responseDeleteMission,
            responseDeleteSession
        });
    } catch (error) {
        insertLog(error, errorLogFile);
        res.json({
            "error": "Error deleteMission: " + error.msg ?? error
        });
    }

}

module.exports = {
    deleteMission
}