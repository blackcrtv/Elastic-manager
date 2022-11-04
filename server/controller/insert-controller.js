const { insertElastic, actionKeyElastic } = require("../../database/elastic");
const { ES, errorLogFile, auditFile } = require('../../conf.json');
const { insertLog } = require('../../Logs/Script/formatLogs');
const { getCurrentTime } = require('../../Logs/Script/formatLogs');

const insertMission = async (req, res, next) => {
    const mission = req.params.mission;
    let { user, role, token, tip, locatie } = req.body;
    
    try {
        let messageAudit = `${user} created mission ${mission};`;
        let searchMissions = await actionKeyElastic(false, false, ES.INDEX_MISIUNI);
        let responseSearchMission = searchMissions.hits?.hits.map(el => el._source.misiune) ?? [];
        if (responseSearchMission.includes(mission)) {
            throw new Error("Mission already exists!")
        }

        let dataMission = {
            "misiune": mission.toLowerCase(),
            "tip": tip,
            "locatie": locatie,
            "data_creare": getCurrentTime().elasticFormat,
            "data_update": getCurrentTime().elasticFormat
        }
        let responseInsert = await insertElastic(ES.INDEX_MISIUNI, dataMission);
        if (responseInsert.err) {
            insertLog(responseInsert, errorLogFile);
        } else {
            insertLog(messageAudit, auditFile);
        }
        res.json({
            responseInsert
        });
    } catch (error) {
        insertLog(error + "", errorLogFile);
        res.json({
            "errorMsg": "Error insertMission",
            error: error + ""
        });
    }

}

const insertSession = async (req, res, next) => {
    const mission = req.params.mission;
    const session = req.params.session;
    let { user, role, token } = req.body;
    try {
        let messageAudit = `${user} created session ${session} from ${mission};`;
        let searchSessions = await actionKeyElastic("misiune_apartinatoare.keyword", mission, ES.INDEX_SESIUNI);
        let responseSearchSession = searchSessions.hits?.hits.map(el => el._source.sesiune) ?? [];

        if (responseSearchSession.includes(session)) throw new Error("Session in this mission already exists!");

        let dataSession = {
            "sesiune": session.toLowerCase(),
            "misiune_apartinatoare": mission.toLowerCase(),
            "data_creare": getCurrentTime().elasticFormat,
            "data_update": getCurrentTime().elasticFormat
        }
        let responseInsert = await insertElastic(ES.INDEX_SESIUNI, dataSession);
        if (responseInsert.err) {
            insertLog(responseInsert, errorLogFile);
        } else {
            insertLog(messageAudit, auditFile);
        }
        res.json({
            responseInsert
        });
    } catch (error) {
        insertLog(error + "", errorLogFile);
        res.json({
            "errorMsg": "Error insertSession",
            error: error + ""
        });
    }

}

module.exports = {
    insertMission,
    insertSession
}