
var mysql = require('mysql');

exports.pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Andrew99**@@',
    database: 'library'
});
