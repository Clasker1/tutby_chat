var express = require('express');
var mysql = require('mysql');
var crypto = require('crypto');
var chatModule = require('./chat_module');
var app = express();

var checkRegExp = /[0-9a-zA-Z]{8,40}/;

app.use(express.logger("dev"));
app.use(express.cookieParser());
app.use(express.session({secret: 'secret cat'}));
app.use(express.urlencoded());
app.use(express.json());
app.use(app.router);

app.set('view engine', 'ejs');
app.set('views', './views');
app.use('/css', express.static(__dirname + '/css'));
app.use('/img', express.static(__dirname + '/img'));
app.use('/js', express.static(__dirname + '/js'));
app.use('/views', express.static(__dirname + '/views'));

var connection = mysql.createConnection({
    user: "root",
   // password: "hello",
    password: "GitHub", // Ilya's password
    database: "tutby_chat",
    port: "3306",
    host: "localhost"
});
connection.connect(function (err) {
    if (err != null) {
        console.log("Error connecting to mysql");
    } else {
        console.log("Connected to mysql");
    }
    // connected! (unless `err` is set)
});
function checkAuth(req, res, next) {
    if (req.session.user_id) {
        next();
    } else {
        res.redirect('/login');
    }
}
app.get('/', function (req, res) {
    res.redirect('/main');
});
app.get('/main', checkAuth, function (req, res) {
    res.render('main');
});
app.get('/login', function (req, res) {
    res.render('login');
});
app.get('/registration', function (req, res) {
    res.render('registration');
});
app.post('/login', function (req, res) {
    var user = req.body.user;
    var password =req.body.password;
//    if(!checkRegExp.test(user)){
//        res.render('/login');
 //   }
 //   if(!checkRegExp.test(password)){
 //       res.render('/login');
//    }
    var hash_password=crypto.createHash('sha1').update(password).digest('hex');
    var sql = "SELECT password,id FROM users WHERE login = ?";
    connection.query(sql,[user], function(err, results) {
        if( results[0] == undefined ){
            console.log("Login failure for %s!",user);
            res.redirect('/login');
        }else{
            if(results[0].password == hash_password)
            {
                req.session.user_id=results[0].id;
                res.cookie("user_id", results[0].id);
                console.log("Login success for %s!",user);
                res.redirect('/main');
            }else{
                console.log("Login failure for %s!",user);
                res.redirect('/login');
            }
        }
    });
});
app.post('/registration',function(req, res){
    var user = req.body.user;
    var password =req.body.password;
 //   if(!checkRegExp.test(user)){
 //       res.render('/registration');
 //   }
//    if(!checkRegExp.test(password)){
//        res.render('/registration');
//    }
    var hash_password=crypto.createHash('sha1').update(password).digest('hex');
    var sql = "SELECT login FROM users WHERE login = ? ";
    connection.query(sql,[user],function(err, results) {
        if(results[0] == undefined){
            var sql = "INSERT INTO users(login,password)  VALUES( ?,? )";
            connection.query(sql,[user,hash_password],function(err, results){
            });
            console.log('Registration success for %s!',user);
            res.redirect('/login');
        }else{
            console.log('Registration failure for %s!',user);
            res.redirect('/registration');
        }
    });

});
app.get('/logout',checkAuth, function (req,res){
    req.session.user_id=undefined;
    res.redirect('/login');
});

app.get('/set_offline',checkAuth, function (req, res) {
    var user_id = req.session.user_id;
    connection.query("update users set status = 0 where id= ? ;",[user_id], function(err, rows){
        // There was a error or not?
        if(err != null) {
            res.end("Query error:" + err);
            connection.end();
        } else {
            // Shows the result on console window
            console.log("Status changed on offline");
        }
    });
    console.log('now im offline');
    res.redirect('back');
});
app.get('/set_online',checkAuth, function (req, res) {
    var user_id = req.session.user_id;
    connection.query("update users set status=1 where id= ? ;",[user_id], function(err, rows){
        if(err != null) {
            res.end("Query error:" + err);
            connection.end();
        } else {
            // Shows the result on console window
            console.log("Status changed on online");
        }
    });
    console.log('now im online');
    res.redirect('back');
});
app.get('/set_out',checkAuth, function (req, res) {
    var user_id = req.session.user_id;
    connection.query("update users set status=2 where id= ? ;",[user_id],function(err, rows){
        // There was a error or not?
        if(err != null) {
            res.end("Query error:" + err);
            connection.end();
        } else {
            // Shows the result on console window
            console.log("Status changed on away");
        }
    });
    console.log('now im out');
    res.redirect('back');
});
app.get('/set_busy',checkAuth, function (req, res) {
    var user_id = req.session.user_id;
    connection.query("update users set status=3 where id= ? ;",[user_id], function(err, rows){
        // There was a error or not?
        if(err != null) {
            res.end("Query error:" + err);
            connection.end();
        } else {
            // Shows the result on console window
            console.log("Status changed on busy");
        }
    });
    console.log('now im busy');
    res.redirect('back');
});
app.post('/add_contact',function(req, res){
    console.log("I am here.");
    var activeUser = req.session.user_id;
    var friend = req.body.typedName;
    var sql0 = "SELECT id FROM users WHERE login = ? ";
    connection.query(sql0,[friend],function(err, results) {

        if(results[0] == undefined){
            console.log('Add friend failed for %s!',friend);
            console.log('Add friend also failed for active %s!',activeUser);
            res.redirect('/add_contact');}
        var res1=results[0].id;
        var sql = "INSERT IGNORE INTO friend VALUES (?,?)";
        var activeUser2 = req.session.user_id;
        var i= connection.query(sql,[res1,activeUser2],function(err, results) {
        });
        console.log(i.sql);
        var j= connection.query(sql,[activeUser2,res1],function(err, results) {
        });
        console.log(j.sql);
    });

});
app.post('/showUserDialog',checkAuth, function (req, res) {
    var userName = 'Not found';
    var id = parseInt(req.body.userId);
// Получение инфы  о юзере
    switch (id) {
        case 1:
            userName = 'Meepo';
            break;
        case 2:
            userName = 'Timbersaw';
            break;
        case 3:
            userName = 'Antimage';
            break;
        case 4:
            userName = 'Batrider';
            break;
        case 5:
            userName = 'Invoker';
            break;
    }
    res.json({"userName": userName, "status": 'online', "image": 'def_user'});

});

app.listen(process.env.PORT || 8083);
