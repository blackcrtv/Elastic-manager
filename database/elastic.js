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
        let response = await deleteElastic(query, index_dest)
        return response;
    } catch (error) {
        console.log(error)
        return null;
    }

}
module.exports.deleteKeyElastic = deleteKeyElastic;