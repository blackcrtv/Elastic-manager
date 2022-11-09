const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { SQLITE } = require('../conf.json')

/**
 * Creare fisier sqlite in folderul dir (creat daca nu exista)
 * @param {Create table string (data-datatype)} query 
 * @param {Coloanele din Elasticsearch} columns 
 * @param {Datele din index} values 
 * @param {Contine numele misiunii pentru a fiserul sqlite} filename 
 */
const createDB = async (query, columns, values, filename) => {
    try {
        let pathFolder = `../local/${SQLITE.DIRECTOR_EXPORT}`;
        if (!fs.existsSync(pathFolder)) {
            fs.mkdirSync(pathFolder);
        }
        const date = new Date();
        const [month, day, year] = [date.getMonth() + 1, date.getDate(), date.getFullYear()];
        const [hour, minutes, seconds] = [date.getHours(), date.getMinutes(), date.getSeconds()];

        let name = pathFolder.concat('-', filename, '-', day.toLocaleString(undefined, { minimumIntegerDigits: 2 }), '-', month.toLocaleString(undefined, { minimumIntegerDigits: 2 }), '-', year, '-', hour.toLocaleString(undefined, { minimumIntegerDigits: 2 }), '.', minutes.toLocaleString(undefined, { minimumIntegerDigits: 2 }), '.', seconds.toLocaleString(undefined, { minimumIntegerDigits: 2 }), '.db')
        let db = new sqlite3.Database(path.join(pathFolder, name), (err) => {
            if (err != null)
                console.log(err);
        });
        return new Promise((resolve, reject) => {
            db.serialize(function () {
                db.run(query);

                for (var i = 0; i < values.length; i++) {
                    let value = ''
                    for (const [k, v] of Object.entries(values[i])) {
                        switch (typeof v) {
                            case 'number':
                                value = value + v + ',';
                                break;
                            case 'object':
                                value = value + '\'' + JSON.stringify(v) + '\',';
                                break;
                            default:
                                value = value + '\'' + v + '\',';
                        }
                    }
                    value = value.substring(0, value.length - 1);
                    stmt = db.prepare("INSERT INTO " + columns + " VALUES (" + value + ")").run();
                    stmt.finalize();
                    resolve(true)
                }
            });
        })
    } catch (error) {
        console.error('Eroare creare tabel');
    }
}
module.exports.createDB = createDB;

/**
 * Citire si inserare in elasticsearch a datelor din fisiere.
 * @param {Calea din care se va citi fisierul de tip .db} path 
 */
 const importFromDB =  async (pathFile) =>{
    let db = new sqlite3.Database(pathFile, (err)=>{
        if(err != null){
            console.log('Eroare citire fisier db: ' + err )
            return 0;
        }
    });
    let sql = `SELECT * FROM 'THOR_EXPORT'`;
    let insert = {}
    db.all(sql, [], (err, rows) => {
        if (err) {
            throw err;
        }
        rows.forEach((row) => {
            insert = {...row}
            delete insert['system_info']
            delete insert['_index']
            
            let index_import = row._index;
            index_import = 'index_test_import' //pt dezvoltare

            let data = {system_info:'false',...insert};
            if (typeof JSON.parse(row.system_info) != 'object') {
                return;
            }
            else
            {
                data = {system_info:JSON.parse(row.system_info),...insert};
            }

            compareBlacklist(data.system_info.imsi_str,data.system_info.imei_str).then((obj)=>{
                data.blacklistImsi = obj.criptonimIMSI;
                data.blacklistImei = obj.criptonimIMEI;
                data.blacklistPereche = obj.criptonimPERECHE;

                getElastic.insertElastic(index_import,data).catch((err)=>{
                    console.log('Eroare la inserare Elasticsearch!')
                });

            }).catch((err)=>{
                console.log('Eroare la comparare!')
            })    
        });
    });
    db.close();
    let tmp = pathFile.split('\\');
    let file = tmp[tmp.length - 1];
    console.log(pathFile, '  ',path.join(__dirname, 'Imported-' + file))

    return 1;
}
module.exports.importFromDB = importFromDB;