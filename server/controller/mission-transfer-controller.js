const { searchMultipleKeyElastic, getMappingIndex, publishElastic, updateStatusEs } = require("../../database/elastic");
const { exportDB, importDb } = require("../../database/sqlite");
const { ES, errorLogFile, auditFile, SQLITE } = require('../../conf.json');
const { insertLog } = require('../../Logs/Script/formatLogs');
const fs = require('fs');
const path = require('path');
// let { indexesProperties } = require('../../dummy.json');

const exportMission = async (req, res, next) => {
    const mission = req.params.mission;
    let { user, role, token, destination } = req.body;
    try {
        let messageAudit = `${user} exported mission: ${mission};`;
        let directorExport = SQLITE.DIRECTOR_EXPORT;
        if (destination == "dispecerat") directorExport = SQLITE.DIRECTOR_DISPECERAT;

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

        let raspEs = await updateStatusEs("Started", "", mission);
        if (raspEs.statusCode >= 400) throw new Error('Eroare creare doc!');
        idES = raspEs.body._id;


        let exportData = await searchMultipleKeyElastic(queryCatch, ES.INDEX_ALL_CATCH);
        let exportBlacklist = await searchMultipleKeyElastic(queryBlacklist, ES.INDEX_BLACKLIST);
        let exportSesiuni = await searchMultipleKeyElastic(querySesiuni, ES.INDEX_SESIUNI);
        let exportMisiune = await searchMultipleKeyElastic(queryMisiuni, ES.INDEX_MISIUNI);

        let { body: mappingIndex } = await getMappingIndex(ES.INDEX_ALL_CATCH);
        let { body: mappingBlacklist } = await getMappingIndex(ES.INDEX_BLACKLIST);
        let { body: mappingSesiuni } = await getMappingIndex(ES.INDEX_SESIUNI);
        let { body: mappingMisiune } = await getMappingIndex(ES.INDEX_MISIUNI);
        let indexesProperties = formatMapping({ ...mappingIndex, ...mappingBlacklist, ...mappingSesiuni, ...mappingMisiune })
        let exportResult = await exportDB(indexesProperties, [...exportData.hits.hits, ...exportBlacklist.hits.hits, ...exportMisiune.hits.hits, ...exportSesiuni.hits.hits], mission, directorExport);

        if (exportResult) { }
        insertLog(messageAudit, auditFile);

        if (exportData.hits.hits.length) {
            await updateStatusEs("Empty", idES);
        } else await updateStatusEs("Finished", idES);

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
        let importDirectory = path.join(__dirname, "/../../local/", SQLITE.DIRECTOR_IMPORT);
        let filesList = fs.readdirSync(importDirectory);
        filesList = filesList.filter(file => {
            if (file.includes("Export")) return file;
        });
        let idES, missionId;
        for (let i = 0; i < filesList.length; i++) {
            missionId = filesList[i].split('-')[1];
            let raspEs = await updateStatusEs("Started", "", missionId);
            if (raspEs.statusCode >= 400) throw new Error('Eroare creare doc!');
            idES = raspEs.body._id;

            let importData = await importDb(filesList[i]);
            let publishData = await publishElastic(importData);

            fs.renameSync(path.join(importDirectory, filesList[i]), path.join(importDirectory, filesList[i].replace("Export", "Imported")));
            await updateStatusEs("Finished", idES, missionId);
        }
        res.json({
            filesList,
            status: (filesList.length ? true : false)
        });
    } catch (error) {
        console.log(error)
        insertLog(error, errorLogFile);
        await updateStatusEs("Error", idES, missionId);
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