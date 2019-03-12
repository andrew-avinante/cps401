'use strict';

var db = require('../config/db');

function BookSubjects(bookId, subject) {
    this.bookId = bookId;
    this.subject = subject;
}

BookSubjects.search = function (id, callback) {
    db.pool.getConnection(function (err, connection) {
        connection.query(`select * from booksubjects where bookid = ${id}`, function (err, data) {
            connection.release();              
            if (err) return callback(err);
            // console.log(data);
            if (data) {
                var results = [];
                for (var i = 0; i < data.length; ++i) {
                    var item = data[i];
                    results.push(new BookSubjects(item.BookID, item.Subject));
                }
                callback(null, results);
            } else {
                callback(null, null);
            }
        });
    });
}

module.exports = BookSubjects;