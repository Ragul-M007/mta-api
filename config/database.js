/**
 * @author Bharathiraja M
 * @email bharathiraja.m@skeintech.com
 * @create date 2021-03-22 12:14:11
 * @desc [description]
 */

var mysql = require('mysql2')

/**
 * Dot env configuration
 */

require('dotenv').config()



const database = mysql.createPool({
    multipleStatements: true,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    connectionLimit: 1,
    dateStrings: "DATETIME",
    connectTimeout : 20000
})



module.exports.database = {
    connection: database,
    beginTransaction: async () => await database.promise().query("SET autocommit = 0 ; START TRANSACTION;"),
    commit: async () => await database.promise().query("COMMIT; SET autocommit = 1 ; "),
    rollback: async () => await database.promise().query("ROLLBACK ;SET autocommit = 1 ;")
}

