const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { SQLITE } = require('../conf.json');
const { resolve } = require('path');

/**
 * Creare fisier sqlite in folderul dir (creat daca nu exista)
 * @param {Create table string (data-datatype)} query 
 * @param {Coloanele din Elasticsearch} columns 
 * @param {Datele din index} values 
 * @param {Contine numele misiunii pentru a fiserul sqlite} filename 
 */
const createDB = async (query, filename, director) => {
    try {
        let pathFolder = "./local/" + director;
        if (!fs.existsSync(pathFolder)) {
            fs.mkdirSync(pathFolder);
        }
        const date = new Date();
        const [month, day, year] = [date.getMonth() + 1, date.getDate(), date.getFullYear()];
        const [hour, minutes, seconds] = [date.getHours(), date.getMinutes(), date.getSeconds()];
        let name = "Export" + '-' + filename + '-' + day.toLocaleString(undefined, { minimumIntegerDigits: 2 }) + '-' + month.toLocaleString(undefined, { minimumIntegerDigits: 2 }) + '-' + year + '-' + hour.toLocaleString(undefined, { minimumIntegerDigits: 2 }) + '.' + minutes.toLocaleString(undefined, { minimumIntegerDigits: 2 }) + '.' + seconds.toLocaleString(undefined, { minimumIntegerDigits: 2 }) + '.db';
        let db = new sqlite3.Database(path.join(pathFolder, name), (err) => {
            if (err != null)
                console.log(err);
        });
        return new Promise((resolve, reject) => {
            db.serialize(async function () {
                await Promise.all(query.split(';').filter(async (table) => {
                    if (table.includes('CREATE')) {
                        await dbRunQuery(db, table);
                    }
                }));
                resolve(db)
            });
        });
    } catch (error) {
        console.error(error);
        throw new Error('Eroare creare tabel!');
    }
}
module.exports.createDB = createDB;

const insertDB = async (db, values, format) => {

    return new Promise((resolve, reject) => {
        let query = values.map((elem) => {
            return "INSERT INTO " + elem._index + insertFormatString(elem, format);
        });

        db.serialize(async function () {
            await Promise.all(query.map(async (insert) => {
                return await dbRunQuery(db, insert).catch(reject);
            }));
            resolve(true)
        });

    });
}
module.exports.insertDB = insertDB;

const exportDB = async (properties, data, misiune, director) => {
    let dbCreated;
    try {
        let tableFormat = createTable(properties);
        dbCreated = await createDB(tableFormat, misiune, director);
        let responseInsert = await insertDB(dbCreated, data, properties);
        dbCreated.close();
        return responseInsert;

    } catch (error) {
        (dbCreated ? dbCreated.close() : '');
        console.log(error)
        throw new Error('Exportul nu a putut fi realizat');
    }
}
module.exports.exportDB = exportDB;

const insertFormatString = (object = {}, tableFormat) => {
    let structureInsert = tableFormat.filter(el => el.index === object._index)[0]?.properties.reduce((prev, curr) => {
        return prev = {
            ...prev,
            [Object.keys(curr)[0]]: Object.entries(curr)[0][1].type ?? 'text'
        }
    }, {});
    let queryObj = Object.entries(object._source).reduce((prev, curr) => {
        let value = curr[1];
        if(value === null || value.length === 0) return {...prev}
        if (curr[0] == "system_info" || curr[0] == "schimbariSIM") {
            delete curr[1].DEBUG_BYTES_BASE64;
            value = '\'' + JSON.stringify(curr[1]) + '\'';
        }
        if ((structureInsert[curr[0]] == 'text' || structureInsert[curr[0]] == 'date' || structureInsert[curr[0]] == 'geo_point') && curr[0] != "system_info") {
            value = '"' + value + '"';
        }
        if (!curr[1]) value = '""';
        return {
            fields: [...prev.fields, curr[0]],
            values: [...prev.values, value]
        }
    }, {
        fields: [],
        values: []
    });
    return "(" + queryObj.fields.join(',') + ') VALUES( ' + queryObj.values.join(',') + ')';
}
const getColumns = (fields = []) => {
    return fields.reduce((prev, curr) => {
        return prev + " " + Object.keys(curr)[0] + " " + (Object.entries(curr)[0][1].type ?? "text") + ", ";
    }, '').slice(0, -2);
}

const createTable = (tablesArray = []) => {
    let query = tablesArray.reduce((previousValue, currentValue) => {
        return previousValue + 'CREATE TABLE ' + currentValue.index + ' (' + getColumns(currentValue.properties) + ' ); ';
    }, '');
    return query
}

const dbRunQuery = async (db, query) => {
    return new Promise((resolve, reject) => {
        db.run(query, (err) => {
            if (err) {
                console.log(err)
                reject("Eroare executare query")
            }

            resolve(true);
        })
    })
}

const openDb = (filename) => {
    try {
        let pathFolder = "./local/" + SQLITE.DIRECTOR_IMPORT;
        if (!fs.existsSync(pathFolder)) {
            throw new Error('Import director not found!');
        }

        let db = new sqlite3.Database(path.join(pathFolder, filename), (err) => {
            if (err != null)
                console.log(err);
        });
        return db;
    } catch (error) {
        console.error(error);
        throw new Error('Eroare creare tabel!');
    }
}

const selectDb = async (db, query) => {
    return new Promise((resolve, reject) => {
        db.all(query, [], (err, rows) => {
            if (err) {
                reject(err);
            }
            resolve(rows);
        });
    })
}

const importDb = async (filename) => {
    try {
        let db = openDb(filename);
        let tables = await selectDb(db, "select name from sqlite_master where type='table'");
        let dataFromTables = await Promise.all(tables.map(async (tabel)=>{
            let data = await selectDb(db, "select * from " + tabel.name)
            return{
                name: tabel.name,
                data
            }
        }));
        await new Promise((resolve,reject)=>{
            db.close((err)=>{   
                resolve(err)
            });
        }) 
        return dataFromTables;
    } catch (error) {
        console.log(error)
        throw new Error('Error import db!')
    }
}
module.exports.importDb = importDb;