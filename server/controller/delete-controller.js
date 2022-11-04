const { actionKeyElastic, deleteCatchData } = require("../../database/elastic");
const { ES, errorLogFile, auditFile } = require('../../conf.json');
const { insertLog } = require('../../Logs/Script/formatLogs');

const deleteMission = async (req, res, next) => {
    const mission = req.params.mission;
    let { user, role, token } = req.body;
    try {
        let messageAudit = `${user} deleted mission ${mission};`;
        if (!mission) {
            throw new Error("Mission param cant be null!");
        }
        let responseDeleteMission = await actionKeyElastic("misiune.keyword", mission, ES.INDEX_MISIUNI, "delete");
        let responseDeleteSession = await actionKeyElastic("misiune_apartinatoare.keyword", mission, ES.INDEX_SESIUNI, "delete");

        if (responseDeleteMission.err || responseDeleteSession.err) {
            throw new Error('Eroare stergere misiune/sesiune')
        }

        let responseDeleteCatch = await deleteCatchData(mission);

        if (responseDeleteCatch.err) {
            insertLog(responseDeleteCatch, errorLogFile);
            throw new Error('Eroare stergere catch data');
        } else {
            insertLog(messageAudit, auditFile);
        }
        res.json({
            responseDeleteMission,
            responseDeleteSession,
            responseDeleteCatch
        });
    } catch (error) {
        insertLog(error + "", errorLogFile);
        res.json({
            "error": "Error deleteMission: " + error + ""
        });
    }

}

const deleteSession = async (req, res, next) => {
    const mission = req.params.mission;
    const session = req.params.session;

    let { user, role, token } = req.body;
    try {
        let messageAudit = `${user} deleted session ${session} from ${mission};`;
        if (!mission || !session) {
            throw new Error("Mission/session param cant be null!");
        }
        let responseDeleteSession = await actionKeyElastic("sesiune.keyword", session, ES.INDEX_SESIUNI, "delete");

        if (responseDeleteSession.err) {
            insertLog(responseDeleteCatch?.error + " ", errorLogFile);
            throw new Error('Eroare stergere sesiune: ' + responseDeleteSession.error + "");
        }

        let responseDeleteCatch = await deleteCatchData(mission, session);

        if (responseDeleteCatch.err) {
            insertLog(responseDeleteCatch, errorLogFile);
            throw new Error('Eroare stergere catch data');
        } else {
            insertLog(messageAudit, auditFile);
        }
        res.json({
            responseDeleteSession
        });
    } catch (error) {
        insertLog(error + "", errorLogFile);
        res.json({
            "error": "Error deleteSession: " + error + ""
        });
    }

}

module.exports = {
    deleteMission,
    deleteSession
}