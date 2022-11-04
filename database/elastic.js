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
        return {
            search,
            err: true
        };
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
        return {
            err: true,
            error,
            query
        }
    }

}
module.exports.deleteElastic = deleteElastic;

/**
 * Cautare/stergere elemente in functie de cheia aleasa din elasticsearch
 * @param {string} key elasticsearch field to search for
 * @param {string} keyVal key value to match search query
 * @param {string} index_dest 
 * @returns elasticsearch response
 */
const actionKeyElastic = async (key, keyVal, index_dest, option = 'search') => {
    try {
        let query = {
            "query": {
                "match_all": {}
            },
            "size": 10000
        }
        if (key && keyVal)
            query = {
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
                },
                "size": 10000
            }
        
        switch (option) {
            case "delete":
                return await deleteElastic(query, index_dest);
            default:
                return await searchElastic(query, index_dest);
        }
    } catch (error) {
        // console.error(error)
        return {
            error,
            query,
            err: true
        };
    }

}
module.exports.actionKeyElastic = actionKeyElastic;


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
        if (responseInsertBackup.some(el => el.err === true)) {
            return {
                err: true,
                msg: "Eroare in inserare backup",
                errData: responseInsertBackup.filter(el => el.err === true)
            };
        }
        let responseDeleteCatch = await deleteElastic(queryDeleteCatch, ES.INDEX_ALL_CATCH);
        return {
            err: false,
            msg: "all good",
            responseDeleteCatch
        };
    } catch (error) {
        console.error(error);
        throw new Error('Eroare delete catch');
    }
}
module.exports.deleteCatchData = deleteCatchData;
