

let express = require("express");

let mysql = require("mysql");
let pool = mysql.createPool({    
    "host": "localhost",
    "user": "root",
    "password": "Andrew99**@@",
    "database": "web",
    "connectionLimit": 10
});

let bodyParser = require("body-parser");

let app = express();
app.use(bodyParser.urlencoded({extended: false}));

app.get('/registrations', function (req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.send("Problem: " + err);
            return;
        }
        connection.query("SELECT * FROM registration", function (err, results) {
            res.send(results);
            connection.release();  // release connection
        });
    });
});

app.post('/registrations', function (req, res) {
    console.log(req);
    if(req.body.firstName != undefined && req.body.lastName != undefined && req.body.grade != undefined && req.body.email != undefined && req.body.shirtSize != undefined && req.body.hrUsername != undefined)
    {
        if(req.body.shirtSize != "S" && req.body.shirtSize != "M" && req.body.shirtSize != "L")
        {
            res.status(400);
            res.send("Problem: Invalid shirtSize " + req.body.shirtSize);
            return;
        }
        else if(req.body.grade != "9" && req.body.grade != "10" && req.body.grade != "11" && req.body.grade != "12")
        {
            res.status(400);
            res.send("Problem: Invalid grade " + req.body.grade);
            return;
        }
        pool.getConnection(function(err, connection) {
            if (err) {
                res.status(500);
                res.send("Problem: " + err);
                return;
            }
                connection.query("insert into registration(first_name, last_name, grade,email,shirtsize,hrusername) values('" + req.body.firstName + "', '" + req.body.lastName + "', " + parseInt(req.body.grade) + ", '" + req.body.email + "', '" + req.body.shirtSize + "', '" + req.body.usernames + "')", function (err, results) {
                res.status(200);
                res.send(results);
                connection.release();  // release connection
            });
        });
    }
    else
    {
        res.status(400);
        res.send("Problem: Some parameters are undefined");
    }
});

let port = 3000;
app.listen(port, function () {
    console.log('Express server listening on port ' + port);
});