let express = require('express');
let router = express.Router();
let crypto = require('crypto')

let Item = require('../models/item');
let BookSubjects = require('../models/bookSubjects');
let Users = require('../models/users');

exphbs = require('express-handlebars'); // "express-handlebars"

/* GET home page. */
router.get('/', function (req, res, next) {
     res.render("index", 
     {layout : "main", 
     login : !req.session.auth ? 'Login' : req.session.auth['logedIn'] == 1 ? 'Logout' : 'Login'});
});

router.get('/search', function (req, res, next) {
    search(req, res, "main");
});

router.get('/mobile_search', function (req, res, next) {
    res.render("mobileResults", {layout : "mobile", search : 1});
});

router.get('/mobile_searchresult', function (req, res, next){
    search(req, res, "mobile");
});

router.get('/details', function (req, res, next) {
    Item.search(`(${req.query.txtId})`, function (err, data) { 
        if(err)
        {
            res.render('details', 
            {layout : "main",
            login : !req.session.auth ? 'Login' : req.session.auth['logedIn'] == 1 ? 'Logout' : 'Login'
        });
            return;
        }
        data[0].layout = "main";
        BookSubjects.search(req.query.txtId, function (err, results)
        {
            data[0].subjectCat = results;
            data[0].login = !req.session.auth ? 'Login' : req.session.auth['logedIn'] == 1 ? 'Logout' : 'Login';
            data[0].loggedIn = !req.session.auth ? 0 : req.session.auth['logedIn'] == 1 ? 1 : 0;
            res.render('details', data[0]);
        });
    });   
});

router.get('/login', function (req, res, next) {
    res.render("login", 
    {layout : "main",
    login : !req.session.auth ? 'Login' : req.session.auth['logedIn'] == 1 ? 'Logout' : 'Login'});
});

router.post('/login', function (req, res, next) {

    let auth = req.session.auth;
    Users.search(req.body.txtUsername, function (err, data)
    {
        console.log(authPass(req.body.txtPassword));
        if(!err && authPass(req.body.txtPassword) === data.password)
        {
            if (!auth)
            {
                auth = req.session.auth = {}
            }
            auth['username'] = req.body.txtUsername;
            auth['logedIn'] = 1;
            res.redirect("/");
        }
        else
        {
            res.render("login", 
            {layout : "main",
            login : !req.session.auth ? 'Login' : req.session.auth['logedIn'] == 1 ? 'Logout' : 'Login'
            });
        }
    });
});

router.get('/logout', function (req, res, next){
    let auth = req.session.auth;
    if(auth)
    {
        auth['username'] = '';
        auth['logedIn'] = 0;
    }
    res.redirect("/");
});

router.get('/maintain', function (req, res, next){
    Item.search(`(${req.query.txtId})`, function (err, data) { 
        if(err)
        {
            res.render('maintain', 
            {layout : "main",
            login : !req.session.auth ? 'Login' : req.session.auth['logedIn'] == 1 ? 'Logout' : 'Login'
            });
            return;
        }
        data[0].layout = "main";
        data[0].error = req.query.error;
        data[0].login = !req.session.auth ? 'Login' : req.session.auth['logedIn'] == 1 ? 'Logout' : 'Login';
        data[0].loggedIn = !req.session.auth ? 0 : req.session.auth['logedIn'] == 1 ? 1 : 0;
        res.render("maintain", data[0]);
    });   
});

router.post('/maintain', function (req, res, next){
    if(!authEdit(req))
    {
        res.redirect('/');
        return;
    }
    if(req.body.btnCancel)
    {
        res.redirect(req.session.prevRequest.search || '/');
        return;
    }
    if(req.body.btnSave)
    {
        Item.getUpdateCount(req.body.txtId, function(err, data) {
            if(data === parseInt(req.body.txtUpdateCount))
            {
                Item.update(new Item(req.body.txtId, req.body.txtCallNo, req.body.txtAuthor, req.body.txtTitle, req.body.txtPubInfo, req.body.txtDesc, req.body.txtSeries, req.body.txtAddAuthor, req.body.txtUpdateCount), function(err, data)
                {
                    if(err)
                    {
                        res.redirect(`/maintain?error=${encodeURI(err)}`);
                    }
                    else
                    {
                        res.redirect(`/details?txtId=${req.body.txtId}`);
                    }
                });
            }
            else
            {
                res.redirect(`/maintain?txtId=${req.body.txtId}&error=${encodeURI('Update has occured, refreshing browser...')}`);
                    return;
            }
        });
    }
});

function search(req, res, pgLayout)
{
    let regEx = /^[A-Za-z0-9' ]*$/;
    let start = req.query.start | 0;
    let prevStrt = start != 0 ? start - 10 : 0;
    let nxtStrt = start + 10;
    let pager = req.session.pager;
    let prevRequest = req.session.prevRequest;
    prevRequest = req.session.prevRequest = {};
    prevRequest['search'] = req.originalUrl;
    if (!pager)
    {
        pager = req.session.pager = {}
    }
    let curPage = parseInt(start / 10 + 1);
    let view = pgLayout == "mobile" ? "mobileResults" : "index";
    if(req.query.txtTitle === "") 
    { 
        res.render(view, 
            {layout : pgLayout, 
                login : !req.session.auth ? 'Login' : req.session.auth['logedIn'] == 1 ? 'Logout' : 'Login'}); 
        return; 
    }
    if(!regEx.test(req.query.txtTitle))
    {
        res.render(view, 
            {error : "Input contains invalid characters! Only use alphanumeric characters and/or apostrophes", 
        layout : pgLayout,
        login : !req.session.auth ? 'Login' : req.session.auth['logedIn'] == 1 ? 'Logout' : 'Login'});
        return;
    }
    if(!pager[req.query.txtTitle])
    {
        Item.cacheSearch(req.query.txtTitle, function (err, data) {
            pager[req.query.txtTitle] = {dt : data, size : data.length, pgs : (data.length / 10 > parseInt(data.length / 10) ? parseInt(data.length / 10) + 1 : parseInt(data.length / 10))};
            if( start > pager[req.query.txtTitle].size || pager[req.query.txtTitle].size == 0)
            {
                res.render(view, {error : "No results", layout : pgLayout, login : !req.session.auth ? 'Login' : req.session.auth['logedIn'] == 1 ? 'Logout' : 'Login'});
                return;
            }
            Item.page(start, pager[req.query.txtTitle].dt, function(err, data) {
                Item.search(data, function (err, data) { 
                    if(err)
                    {
                        res.render(view, {layout : pgLayout, login : !req.session.auth ? 'Login' : req.session.auth['logedIn'] == 1 ? 'Logout' : 'Login'});
                        return;
                    }
                    res.render(view, {
                        title : req.query.txtTitle,
                        details : data, 
                        resultsIndicator : `Page ${curPage} of ${pager[req.query.txtTitle].pgs} (${pager[req.query.txtTitle].size} matches)`,
                        prevBtn : (start != 0 ? "<< Prev" : ""),
                        prevPageIdx : prevStrt,
                        nextBtn : (start + 10 < pager[req.query.txtTitle].size ? "Next >>" : ""),
                        nextPageIdx : nxtStrt,
                        login : !req.session.auth ? 'Login' : req.session.auth['logedIn'] == 1 ? 'Logout' : 'Login',
                        layout : pgLayout
                    });
                });   
            });
        });
    }
    else
    {
        if( start > pager[req.query.txtTitle].size || pager[req.query.txtTitle].size == 0)
        {
            res.render(view, {error, layout : pgLayout, login : !req.session.auth ? 'Login' : req.session.auth['logedIn'] == 1 ? 'Logout' : 'Login'});
            return;
        }
        Item.page(start, pager[req.query.txtTitle].dt, function(err, data) {
            Item.search(data, function (err, data) { 
                if(err)
                {
                    res.render(view, {layout : pgLayout});
                    return;
                }
                res.render(view, {
                    search : 0,
                    title : req.query.txtTitle,
                    details : data, 
                    resultsIndicator : `Page ${curPage} of ${pager[req.query.txtTitle].pgs} (${pager[req.query.txtTitle].size} matches)`,
                    prevBtn : (start != 0 ? "<< Prev" : ""),
                    prevPageIdx : prevStrt,
                    nextBtn : (start + 10 < pager[req.query.txtTitle].size ? "Next >>" : ""),
                    nextPageIdx : nxtStrt,
                    login : !req.session.auth ? 'Login' : req.session.auth['logedIn'] == 1 ? 'Logout' : 'Login',
                    layout: pgLayout
                });
            });   
        });  
    }
}

function authEdit(req)
{
    return req.session.auth;
}

function authPass(password)
{
    return crypto.createHash('sha256').update(password).digest('hex');
}

module.exports = router;

