const { Client: Client7 } = require('es7')
const { ES } = require('../conf.json')


/**
 *  Utilizat pentru import in Elasticsearch
 * @param indexul in care se doreste a se importa datele _index 
 * @param datele de importat _data 
 */
const insertElastic = async (_index, _data) => {
    try {
        const client = new Client7({ node: ES.IP })

        return await client.index({
            index: _index,
            body: _data
        });
    } catch (error) {
        console.log(error)
        return {
            err: true,
            errMsg: error,
            data: _data
        };
    }

}
module.exports.insertElastic = insertElastic;

const searchElastic = async (search, index_dest) => {
    try {
        const client = new Client7({ node: ES.IP })
        let { body } = await client.search({
            index: index_dest,
            body: search
        })
        // console.log(body)
        return body;
    } catch (error) {
        console.log(error)
        return null;
    }

}
module.exports.searchElastic = searchElastic;

const deleteElastic = async (query, index_dest) => {
    try {
        const client = new Client7({ node: ES.IP })
        let { body } = await client.delete({
            index: index_dest,
            body: query
        })
        return body;
    } catch (error) {
        console.log(error)
        return null;
    }

}
module.exports.deleteElastic = deleteElastic;

/**
 * Steregere elemente in functie de cheia aleasa din elasticsearch
 * @param {string} key elasticsearch field to search for
 * @param {string} keyVal key value to match delete query
 * @param {string} index_dest 
 * @returns elasticsearch response
 */
const deleteKeyElastic = async (key, keyVal, index_dest) => {
    try {
        let query = {
            "query": {
                "bool": {
                    "must": [
                        {
                            "match": {
                                [key]: keyVal
                            }
                        }
                    ]
                }
            }
        }
        let response = await searchElastic(query, index_dest)
        return response;
    } catch (error) {
        console.log(error)
        return null;
    }

}
module.exports.deleteKeyElastic = deleteKeyElastic;

const deleteCatchData = async (mission, session) => {
    try {
        let queryDeleteCatch = {
            "query": {
                "bool": {
                    "must": [
                        {
                            "match": {
                                "mission_id.keyword": mission
                            }
                        }
                    ]
                }
            },
            "size": 10000
        }
        if (session) {
            queryDeleteCatch.query.bool.must[1] = {
                "match": {
                    "session_id.keyword": session
                }
            };
        }
        let searchCatch = await searchElastic(queryDeleteCatch, ES.INDEX_ALL_CATCH);

        let responseInsertBackup = await Promise.all(searchCatch.hits.hits.map(async (catchEl) => {
            let toInsert = {
                ...catchEl._source,
                indexElastic: catchEl._index
            }
            return await insertElastic(ES.INDEX_BACKUP_CATCH, toInsert);
        }));
        // let responseDeleteCatch = await deleteElastic(queryDeleteCatch, ES.INDEX_ALL_CATCH);
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}
module.exports.deleteCatchData = deleteCatchData;