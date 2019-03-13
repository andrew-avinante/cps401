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
    {
        layout : "main", 
        login : !req.session.auth ? 'Login' : req.session.auth['loggedIn'] == 1 ? 'Logout' : 'Login' // Used to display login or logout button
    });
});

/* GET search page */
router.get('/search', function (req, res, next) {
    search(req, res, "main");   // calls function that computes search results
});

/* GET mobile page */
router.get('/mobile_search', function (req, res, next) {
    res.render("mobileResults", {layout : "mobile", search : 1});
});

router.get('/mobile_searchresult', function (req, res, next){
    search(req, res, "mobile"); // calls function that computes search results and puts it on mobile version
});

/* GET details page */
router.get('/details', function (req, res, next) {
    // Try to search for the book that was clicked on via the ID
    Item.search(`(${req.query.txtId})`, function (err, data) { 
        if(err)  // if search fails, then print error
        {
            res.render('details', 
            {
                layout : "main",
                error : "There was an error on our end! Please make sure there is a valid ID",
                login : !req.session.auth ? 'Login' : req.session.auth['loggedIn'] == 1 ? 'Logout' : 'Login' // Used to display login or logout button
            });
            return;
        }
        data[0].layout = "main"; // add main layout to data
        BookSubjects.search(req.query.txtId, function (err, results) // search for book subjects via text ID
        { 
            if(err)  // if search for subject fails, then print results with error
            {
                data[0].error = "Cannot retrieve subject";
                data[0].login = !req.session.auth ? 'Login' : req.session.auth['loggedIn'] == 1 ? 'Logout' : 'Login'; // Used to display login or logout button
                data[0].loggedIn = !req.session.auth ? 0 : req.session.auth['loggedIn'] == 1 ? 1 : 0; // Used to display maintenance button
                res.render('details', data[0]);
                return;
            }
            data[0].subjectCat = results;
            data[0].login = !req.session.auth ? 'Login' : req.session.auth['loggedIn'] == 1 ? 'Logout' : 'Login'; // Used to display login or logout button
            data[0].loggedIn = !req.session.auth ? 0 : req.session.auth['loggedIn'] == 1 ? 1 : 0; // Used to display maintenance button
            res.render('details', data[0]);
        });
    });   
});

/* GET login page */
router.get('/login', function (req, res, next) {
    res.render("login", {
        layout : "main",
        login : !req.session.auth ? 'Login' : req.session.auth['loggedIn'] == 1 ? 'Logout' : 'Login' // Used to display login or logout button
    });
});

/* POST login page */
router.post('/login', function (req, res, next) {

    let auth = req.session.auth;    // get auth session

    // Search for user in user table via username
    Users.search(req.body.txtUsername, function (err, data)
    {
        // verifiy password
        if(!err && authPass(req.body.txtPassword) === data.password)
        {
            // if password is authenticated then check if session exists
            if (!auth)
            {
                // create new session
                auth = req.session.auth = {}
            }

            // set session username and logged in bool
            auth['username'] = req.body.txtUsername;
            auth['loggedIn'] = 1;
            res.redirect("/");
            return;
        }
        else // if authentication fails, reload login page
        {
            res.render("login", {
                layout : "main",
                login : !req.session.auth ? 'Login' : req.session.auth['loggedIn'] == 1 ? 'Logout' : 'Login'
            });
        }
    });
});

/* GET logout request */
router.get('/logout', function (req, res, next){
    let auth = req.session.auth; // get auth session
    if(auth) // if auth session exists then set auth to null
    {
        req.session.auth['username'] = "";
        req.session.auth['loggedIn'] = 0;
        req.session.auth = null;
    }
    res.redirect("/login");
});

/* GET maintain page */
router.get('/maintain', function (req, res, next){
    
    // authenticate that user is actually aloud to go to maintain page
    if(!authEdit(req))
    {  
        res.redirect('/login'); // if not then redirect to login page
        return;
    }

    // search for requested item to maintain and populate text boxes with appropriate information
    Item.search(`(${req.query.txtId})`, function (err, data) { 
        if(err)
        {
            res.render('maintain', {
                layout : "main",
                login : !req.session.auth ? 'Login' : req.session.auth['loggedIn'] == 1 ? 'Logout' : 'Login'
            });
            return;
        }

        // adding variables to data object
        data[0].layout = "main";
        data[0].error = req.query.error;
        data[0].login = !req.session.auth ? 'Login' : req.session.auth['loggedIn'] == 1 ? 'Logout' : 'Login';
        data[0].loggedIn = !req.session.auth ? 0 : req.session.auth['loggedIn'] == 1 ? 1 : 0;
        res.render("maintain", data[0]);
    });   
});

/* POST maintain page */
router.post('/maintain', function (req, res, next){

    // authenticate that user is actually aloud to go to maintain page
    if(!authEdit(req))
    {
        res.redirect('/login'); // if not then redirect to login
        return;
    }

    // check if user pressed cancel button
    if(req.body.btnCancel)
    {
        res.redirect(req.session.prevRequest.search || '/'); // redirect to the search page user was on
        return;
    }

    // check if user pressed save
    if(req.body.btnSave)
    {
        // make sure updates haven't occured on the data user is editing
        Item.getUpdateCount(req.body.txtId, function(err, data) {
            // if no updates have occured then continue
            if(data === parseInt(req.body.txtUpdateCount))
            {
                // update data
                Item.update(new Item(req.body.txtId, req.body.txtCallNo, req.body.txtAuthor, req.body.txtTitle, req.body.txtPubInfo, req.body.txtDesc, req.body.txtSeries, req.body.txtAddAuthor, req.body.txtUpdateCount), function(err, data)
                {
                    if(err)
                    {
                        res.redirect(`/maintain?txtId=${req.body.txtId}&error=${encodeURI(err)}`);
                    }
                    else
                    {
                        res.redirect(`/details?txtId=${req.body.txtId}`);
                    }
                });
            }
            else  // else redirect to maintain page and display error
            {
                res.redirect(`/maintain?txtId=${req.body.txtId}&error=${encodeURI('Update has occured, refreshing browser...')}`);
                    return;
            }
        });
    }
});


// function that handles search
function search(req, res, pgLayout)
{
    let regEx = /^[A-Za-z0-9' ]*$/;             // regex variable
    let start = req.query.start | 0;            // paging index
    let prevStrt = start != 0 ? start - 10 : 0; // index for previous page paging
    let nxtStrt = start + 10;                   // index for next page paging
    let pager = req.session.pager;              // session for storing previously searched queries
    let prevRequest = req.session.prevRequest;  // session for saving previously visted pages (for cancel button under maintain)
    let curPage = parseInt(start / 10 + 1);     // current page number
    let view = pgLayout == "mobile" ? "mobileResults" : "index"; // which view to use for rendering
    prevRequest = req.session.prevRequest = {}; // creates previous page object session
    prevRequest['search'] = req.originalUrl;    // sets previously visited page
    
    // if a session doesn't exist for this query then make it
    if (!pager)
    {
        pager = req.session.pager = {}
    }

    // if the title is blank then just return and don't query
    if(req.query.txtTitle === "") 
    { 
        res.render(view, 
            {
                layout : pgLayout, 
                login : !req.session.auth ? 'Login' : req.session.auth['loggedIn'] == 1 ? 'Logout' : 'Login'
            }); 
        return; 
    }

    // if the input contains invalid characters then display an error
    if(!regEx.test(req.query.txtTitle))
    {
        res.render(view, {
                error : "Input contains invalid characters! Only use alphanumeric characters and/or apostrophes", 
                layout : pgLayout,
                login : !req.session.auth ? 'Login' : req.session.auth['loggedIn'] == 1 ? 'Logout' : 'Login'
            });
        return;
    }

    // if session doesn't exist then create a new cache
    if(!pager[req.query.txtTitle])
    {
        // cache query ID's
        Item.cacheSearch(req.query.txtTitle, function (err, data) {
            pager[req.query.txtTitle] = {
                dt : data, 
                size : data.length, 
                pgs : (data.length / 10 > parseInt(data.length / 10) ? parseInt(data.length / 10) + 1 : parseInt(data.length / 10))
            };

            // if user tries to go outside of paging index then display error
            if( start > pager[req.query.txtTitle].size || pager[req.query.txtTitle].size == 0)
            {
                res.render(view, {
                        error : "No results", 
                        layout : pgLayout, 
                        login : !req.session.auth ? 'Login' : req.session.auth['loggedIn'] == 1 ? 'Logout' : 'Login'
                    });
                return;
            }

            // Gets paging list
            Item.page(start, pager[req.query.txtTitle].dt, function(err, data) {
                // searches DB for results
                Item.search(data, function (err, data) { 
                    // if error then report an error
                    if(err)
                    {
                        res.render(view, {
                                layout : pgLayout, 
                                login : !req.session.auth ? 'Login' : req.session.auth['loggedIn'] == 1 ? 'Logout' : 'Login'
                            });
                        return;
                    }
                    // else render
                    res.render(view, {
                        title : req.query.txtTitle,
                        details : data, 
                        resultsIndicator : `Page ${curPage} of ${pager[req.query.txtTitle].pgs} (${pager[req.query.txtTitle].size} matches)`,
                        prevBtn : (start != 0 ? "<< Prev" : ""),
                        prevPageIdx : prevStrt,
                        nextBtn : (start + 10 < pager[req.query.txtTitle].size ? "Next >>" : ""),
                        nextPageIdx : nxtStrt,
                        login : !req.session.auth ? 'Login' : req.session.auth['loggedIn'] == 1 ? 'Logout' : 'Login',
                        layout : pgLayout
                    });
                });   
            });
        });
    }
    else // if session does exist then use session
    {
         // if user tries to go outside of paging index then display error
        if( start > pager[req.query.txtTitle].size || pager[req.query.txtTitle].size == 0)
        {
            res.render(view, {
                error : "No results", layout : pgLayout, login : !req.session.auth ? 'Login' : req.session.auth['loggedIn'] == 1 ? 'Logout' : 'Login'});
            return;
        }
        // Gets paging list
        Item.page(start, pager[req.query.txtTitle].dt, function(err, data) {
            // search DB
            Item.search(data, function (err, data) { 
                if(err)
                {
                    res.render(view, 
                        {
                            layout : pgLayout, 
                            login : !req.session.auth ? 'Login' : req.session.auth['loggedIn'] == 1 ? 'Logout' : 'Login'
                        });
                    return;
                }
                // render
                res.render(view, {
                    title : req.query.txtTitle,
                    details : data, 
                    resultsIndicator : `Page ${curPage} of ${pager[req.query.txtTitle].pgs} (${pager[req.query.txtTitle].size} matches)`,
                    prevBtn : (start != 0 ? "<< Prev" : ""),
                    prevPageIdx : prevStrt,
                    nextBtn : (start + 10 < pager[req.query.txtTitle].size ? "Next >>" : ""),
                    nextPageIdx : nxtStrt,
                    login : !req.session.auth ? 'Login' : req.session.auth['loggedIn'] == 1 ? 'Logout' : 'Login',
                    layout: pgLayout
                });
            });   
        });  
    }
}

// authenticate user is logged in
function authEdit(req)
{
    return req.session.auth;
}

// encrypt user's pass
function authPass(password)
{
    return crypto.createHash('sha256').update(password).digest('hex');
}

module.exports = router;

