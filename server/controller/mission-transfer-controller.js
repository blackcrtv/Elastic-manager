const { searchMultipleKeyElastic, getMappingIndex } = require("../../database/elastic");
const { exportDB, importDb } = require("../../database/sqlite");
const { ES, errorLogFile, auditFile, SQLITE } = require('../../conf.json');
const { insertLog } = require('../../Logs/Script/formatLogs');
// let { indexesProperties } = require('../../dummy.json');

const exportMission = async (req, res, next) => {
    const mission = req.params.mission;
    let { user, role, token, destination } = req.body;
    try {
        let messageAudit = `${user} exported mission: ${mission};`;
        let directorExport = SQLITE.DIRECTOR_EXPORT;
        if(destination == "dispecerat") directorExport = SQLITE.DIRECTOR_DISPECERAT;

        let queryCatch = [{
            method: "match",
            key: "mission_id.keyword",
            value: mission
        }];
        let queryBlacklist = [{
            method: "match",
            key: "misiune.keyword",
            value: mission
        }];
        let querySesiuni = [{
            method: "match",
            key: "misiune_apartinatoare.keyword",
            value: mission
        }];
        let queryMisiuni = [{
            method: "match",
            key: "misiune.keyword",
            value: mission
        }];

        let exportData = await searchMultipleKeyElastic(queryCatch, ES.INDEX_ALL_CATCH);
        let exportBlacklist = await searchMultipleKeyElastic(queryBlacklist, ES.INDEX_BLACKLIST);
        let exportSesiuni = await searchMultipleKeyElastic(querySesiuni, ES.INDEX_SESIUNI);
        let exportMisiune = await searchMultipleKeyElastic(queryMisiuni, ES.INDEX_MISIUNI);

        let { body: mappingIndex } = await getMappingIndex(ES.INDEX_ALL_CATCH);
        let { body: mappingBlacklist } = await getMappingIndex(ES.INDEX_BLACKLIST);
        let { body: mappingSesiuni } = await getMappingIndex(ES.INDEX_SESIUNI);
        let { body: mappingMisiune } = await getMappingIndex(ES.INDEX_MISIUNI);
        let indexesProperties = formatMapping({ ...mappingIndex, ...mappingBlacklist, ...mappingSesiuni, ...mappingMisiune })
        let exportResult = await exportDB(indexesProperties, [...exportData.hits.hits, ...exportBlacklist.hits.hits, ...exportMisiune.hits.hits, ...exportSesiuni.hits.hits ], mission, directorExport);
        
        if(exportResult)
            insertLog(messageAudit, auditFile);
        
        res.json({
            exportResult
        });
    } catch (error) {
        console.error(error)
        insertLog(error, errorLogFile);
        res.json({
            "error": "Error exportMission: " + error
        });
    }

}

const importMission = async (req, res, next) => {
    let { user, role, token } = req.body;
    try {
        let importData = await importDb('Export-magnolia-14-11-2022-14.57.29.db');
        let publishData = await publishElastic(importData);
        console.log(importData);
        res.json({
            importData
        });
    } catch (error) {
        insertLog(error, errorLogFile);
        res.json({
            "error": "Error importMission: " + error.msg ?? error ?? ""
        });
    }

}

const formatMapping = (mappingIndex) => {
    return Object.keys(mappingIndex).map(index => {
        return {
            index,
            properties: Object.keys(mappingIndex[index].mappings.properties).map(field => {
                return {
                    [field]: mappingIndex[index].mappings.properties[field]
                }
            })
        }
    });
}

module.exports = {
    exportMission,
    importMission
}