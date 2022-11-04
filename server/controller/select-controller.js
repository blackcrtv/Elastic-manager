const { actionKeyElastic } = require("../../database/elastic");
const { ES, errorLogFile, auditFile } = require('../../conf.json');
const { insertLog } = require('../../Logs/Script/formatLogs');

const getMissions = async (req, res, next) => {
    let { user, role, token } = req.body;
    try {
        let responseSearchMission = await actionKeyElastic(false, false, ES.INDEX_MISIUNI);
        res.json({
            results: responseSearchMission.hits?.hits.map(el => el._source.misiune) ?? []
        });
    } catch (error) {
        insertLog({
            error,
            text: "Error select mission"
        }, errorLogFile);
        res.json({
            "text": "Error select mission",
            error
        });
    }

}

const getSessions = async (req, res, next) => {
    const mission = req.params.mission;
    let { user, role, token } = req.body;
    try {
        let responseSearchSessions = await actionKeyElastic("misiune_apartinatoare.keyword", mission, ES.INDEX_SESIUNI);
        res.json({
            results: responseSearchSessions.hits?.hits.map(el => el._source.sesiune) ?? []
        });
    } catch (error) {
        insertLog({
            error,
            text: "Error select session"
        }, errorLogFile);
        res.json({
            "text": "Error select session",
            error
        });
    }

}

module.exports = {
    getMissions,
    getSessions
}