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

const insertBulkElastic = async (insertArray = []) => {
    try {
        const client = new Client7({ node: ES.IP })
        let bulkData = [];

        for (let i = 0; i < insertArray.length; i++) {
            for (let j = 0; j < insertArray[i].data.length; j++) {
                // bulkData.push({ index: { _index: "index_test_import" } });
                bulkData.push({ index: { _index: insertArray[i].name } });
                bulkData.push(insertArray[i].data[j]);
            }
        }
        // return bulkData
        if (bulkData.length === 0)
            return {
                body: []
            }
        return await client.bulk({
            body: bulkData
        });
    } catch (error) {
        console.log(error)
        throw new Error('Eroare inserare bulk!')
    }

}
module.exports.insertBulkElastic = insertBulkElastic;

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

/**
 * Inserare in elastic cu _id configurat ce trebuie sa se regaseasca in obiect
 * @param {string} _index 
 * @param {object} _data format query elastic
 * @returns 
 */
const insertElasticWithId = async (_index, _data, _id) => {
    try {
        const client = new Client7({ node: ES.IP })

        return await client.index({
            id: _id,
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
module.exports.insertElasticWithId = insertElasticWithId;

/**
 * Update in elasticsearch la statusul procesului
 * @param id index elasticsearch 
 * @param status actiune(momentan doar "Finished, Empty, Running") status 
 */

const updateStatusEs = async (status, id = "", option = "") => {
    let ip_local = ES.IP.replace('http://', "");

    const date = new Date();
    const [month, day, year] = [date.getMonth() + 1, date.getDate(), date.getFullYear()];
    const [hour, minutes, seconds] = [date.getHours(), date.getMinutes(), date.getSeconds()];

    let dateNow = ''.concat(year, '-', month.toLocaleString(undefined, { minimumIntegerDigits: 2 }), '-', day.toLocaleString(undefined, { minimumIntegerDigits: 2 }), ' ', hour.toLocaleString(undefined, { minimumIntegerDigits: 2 }), ':', minutes.toLocaleString(undefined, { minimumIntegerDigits: 2 }), ':', seconds.toLocaleString(undefined, { minimumIntegerDigits: 2 }))

    let body = {
        status: status,
        ip: ip_local
    }

    try {
        switch (status) {
            case 'Running':
                body = {
                    ...body,
                    date_start: dateNow
                }
                break;
            case 'Finished':
                body = {
                    ...body,
                    date_stop: dateNow
                }
                break;
            case 'Empty':
                body = {
                    ...body,
                    date_stop: dateNow
                }
                break;
            case 'Started':
                body = {
                    ...body,
                    date_start: dateNow,
                    misiune: option
                }
                console.log(body)
                return await insertElastic(ES.INDEX_STATUS_EXPORT, body);
            default:
                body = {
                    ...body,
                    date_stop: dateNow
                }
                break;
        }
        return await insertElasticWithId(ES.INDEX_STATUS_EXPORT, body, id);

    } catch (error) {
        console.log(error);
        throw new Error('Eroare update status elastic')
    }

}
module.exports.updateStatusEs = updateStatusEs;

const deleteElastic = async (query, index_dest) => {
    try {
        const client = new Client7({ node: ES.IP })
        let { body } = await client.deleteByQuery({
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

const searchMultipleKeyElastic = async (keyValArr = [], index_dest, option = 'search', boolOption = 'must') => {
    try {
        let query = {
            "query": {
                "match_all": {}
            },
            "size": 10000
        }
        if (keyValArr.length)
            query = {
                "query": {
                    "bool": {
                        [boolOption]: [
                            keyValArr.map(elem => {
                                return {
                                    [elem.method]: {
                                        [elem.key]: elem.value
                                    }
                                }
                            })
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
module.exports.searchMultipleKeyElastic = searchMultipleKeyElastic;

const getMappingIndex = async (index) => {
    try {
        const client = new Client7({ node: ES.IP })
        return await client.indices.getMapping({
            index
        })
    } catch (error) {
        throw new Error('Eroare obtinere mapare')
    }
}
module.exports.getMappingIndex = getMappingIndex;

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

const publishElastic = async (data = []) => {
    try {
        let filteredData = filterNullKeys(data); //filtrare unde data este gol si fieldurile au valoarea null
        let filterExistingData = await filterExistData(filteredData); //pentru orice index in afara de cei de catch se va verifica daca exista deja datele in elastic dupa anumite criterii
        let responseBulkInsert = await insertBulkElastic(filterExistingData);
        return responseBulkInsert;
    } catch (error) {
        console.error(error);
        throw new Error('Eroare publishElastic');
    }
}
module.exports.publishElastic = publishElastic;

const filterNullKeys = (data = []) => {
    try {
        let filteredData = [];
        for (let i = 0; i < data.length; i++) {
            if (data[i].data.length === 0) continue;
            filteredData.push({
                ...data[i],
                data: data[i].data.map(elem => {
                    Object.keys(elem).forEach(key => {
                        if (elem[key] === null) delete elem[key];
                        if (key === "coordonate" && elem[key] === "") delete elem[key];
                        if (data[i].name?.includes("_catch_") && key === "system_info") elem[key] = JSON.parse(elem[key]);
                    });
                    return elem;
                })
            });
        }
        return filteredData;
    } catch (error) {
        console.log(error);
        return data;
    }
}

const filterExistData = async (data = []) => {
    try {
        let searchInterest = {
            [ES.INDEX_SESIUNI]: ["sesiune", "misiune_apartinatoare"],
            [ES.INDEX_MISIUNI]: ["misiune"],
            [ES.INDEX_BLACKLIST]: ["criptonim", "misiune", "sesiune", "IMSI"]
        }
        let resp = []
        for (let i = 0; i < data.length; i++) {
            if (data[i].name.includes('index_catch_')) continue;

            let queryES = searchInterest[data[i].name].map(field => {
                return {
                    method: "terms",
                    key: field + ".keyword",
                    value: uniqueFromArray(data[i].data.filter(elem => {
                        for (const key in elem) {
                            if (key === field) return elem[key];
                        }
                    }))
                }
            });

            let responseSearch = await searchMultipleKeyElastic(queryES, data[i].name);
            responseSearch.hits.hits.map(elem => {
                data[i].data = data[i].data.filter(value => {
                    let flag = false;
                    for (const key in value) {
                        if (searchInterest[data[i].name]?.includes(key) && value[key] !== elem._source[key]) flag = true;
                    }
                    if (flag) return value;
                })
                return elem._source;
            });
        }
        return data;
    } catch (error) {
        console.log(error);
        throw new Error('Eroare filtrare date deja existente');
    }
}

const uniqueFromArray = (a = []) => {
    for (var i = 0; i < a.length; ++i) {
        for (var j = i + 1; j < a.length; ++j) {
            if (a[i] === a[j])
                a.splice(j--, 1);
        }
    }

    return a;
};