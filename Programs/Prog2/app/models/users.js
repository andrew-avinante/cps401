'use strict';

var db = require('../config/db');

function Users(user, password) {
    this.user= user;
    this.password = password;
}

Users.search = function (uname, callback) {
    db.pool.getConnection(function (err, connection) {
        connection.query(`select * from users where username = '${uname}'`, function (err, data) {
            connection.release();              
            if (err) return callback(err);
            console.log(data);
            if (data) {
                callback(null, new Users(data[0].Username, data[0].Password));
            } else {
                callback(null, null);
            }
        });
    });
}

module.exports = Users;