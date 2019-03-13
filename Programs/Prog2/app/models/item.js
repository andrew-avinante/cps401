'use strict';

var db = require('../config/db');

function Item(id, callNo, author, title, pubInfo, descript, series, addAuthor, updateCount) {
    this.id = id;
    this.callNo = callNo;
    this.author = author;
    this.title = title;
    this.pubInfo = pubInfo;
    this.descript = descript;
    this.series = series;
    this.addAuthor = addAuthor;
    this.updateCount = updateCount;
}

Item.cacheSearch = function (ttl, callback) {
    db.pool.getConnection(function (err, connection) {
        connection.query(`select id from items where title LIKE "%${ttl}%" order by title`, function (err, data) {
            connection.release();              
            if (err) return callback(err);

            if (data) {
                callback(null, data);
            } else {
                callback(null, null);
            }
        });
    });
}

Item.page = function (strt, lst, callback){
    let pageSize = 10;
    let data = "(";
    let i;
    for(i = strt; i < pageSize + strt - 1 && i < lst.length - 1; i++)
    {
        data = data + lst[i].id + ", ";
    }
    data = data + lst[i].id + ")";
    callback(null, data);
}

Item.search = function (lst, callback) {
    console.log(lst);
    db.pool.getConnection(function (err, connection) {
        connection.query(`select * from items where id in ${lst} order by title limit 10`, function (err, data) {
            //console.log(data);
            connection.release();              
            if (err) return callback(err);

            if (data) {
                var results = [];
                for (var i = 0; i < data.length; ++i) {
                    var item = data[i];
                    results.push(new Item(item.ID, item.CALLNO, item.AUTHOR, item.TITLE, item.PUB_INFO,
                        item.DESCRIPT, item.SERIES, item.ADD_AUTHOR, item.UPDATE_COUNT));
                }
                callback(null, results);
            } else {
                callback(null, null);
            }
        });
    });
}

Item.update = function(item, callback)
{
    console.log(item.id);
    if(!item.callNo || !item.title || !item.author)
    {
        callback(`${!item.id ? "Call number" : !item.title ? "Title" : "Author"} is NULL!`, null);
        return;
    }
    db.pool.getConnection(function (err, connection) {
        connection.query(`update ITEMS set CALLNO = "${item.callNo}", AUTHOR = "${item.author}", TITLE = "${item.title}", PUB_INFO = "${item.pubInfo}", DESCRIPT = "${item.descript}", SERIES = "${item.series}", ADD_AUTHOR = "${item.addAuthor}", UPDATE_COUNT = ${item.updateCount} + 1 WHERE ID = ${item.id} AND UPDATE_COUNT = ${item.updateCount}`, function (err, data) {
            connection.release();  
            console.log(err);            
            if (err) return callback(err);

            if (data) {
                callback(null, data);
            } else {
                callback(null, null);
            }
        });
    });
}

Item.getUpdateCount = function(id, callback)
{
    db.pool.getConnection(function (err, connection) {
        connection.query(`select * from items WHERE ID = ${id}`, function (err, data) {
            connection.release();              
            if (err)
            {
                return callback(err, data);
            }
            else
            {
                callback(err, data[0].UPDATE_COUNT);
            }
        });
    });
}

module.exports = Item;