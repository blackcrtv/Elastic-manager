const { searchMultipleKeyElastic, getMappingIndex } = require("../../database/elastic");
const { ES, errorLogFile, auditFile } = require('../../conf.json');
const { insertLog } = require('../../Logs/Script/formatLogs');

const exportMission = async (req, res, next) => {
    const mission = req.params.mission;
    let { user, role, token } = req.body;
    try {
        let queryCatch = [{
            method: "match",
            key: "mission_id",
            value: mission
        }]
        let exportData = await searchMultipleKeyElastic(queryCatch, ES.INDEX_ALL_CATCH);
        let { body: mappingIndex } = await getMappingIndex(ES.INDEX_ALL_CATCH);
        let indexesProperties = Object.keys(mappingIndex).map(index =>{
            return {
                index,
                properties: Object.keys(mappingIndex[index].mappings.properties).map(field =>{
                    return {
                        [field]: mappingIndex[index].mappings.properties[field]
                    }
                })
            }
        });
        let createTableQuery = createTable(indexesProperties);
        res.json({
            indexesProperties
        });
    } catch (error) {
        console.error(error)
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

/**
 * Construirea si organizarea datelor necesare de construire si inserare date sqlite
 * @param {Rezultatul apelarii getElastic.obj_elastic} input 
 * @returns Obiectul ce contine datele necesare pentru creare unui tabel sqlite
 */
const createTable = (tablesArray = []) => {
    let query = tablesArray.reduce((previousValue, currentValue) => {
        let separator = '';
        if(previousValue !== '') separator = '; ';
        return previousValue + separator + 'CREATE TABLE' + currentValue.index;
    }, '');
    return query
}

module.exports = {
    exportMission,
    importMission
}