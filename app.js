
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var MongoStore = require('connect-mongo')(express);
var settings = require('./settings');

var fs = require('fs');
var accessLog = fs.createWriteStream('access.log',{flags : 'a'});
var errorLog = fs.createWriteStream('error.log',{flags:'a'});

var app = express();
var flash = require('connect-flash');
// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'ejs');
app.use(flash());
// app.use(express.bodyParser({keepExtensions:true,uploadDir:'./public/images'}));
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.logger({stream:accessLog}));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser());//cookie解析的中间件
app.use(express.session({       //为会话提供支持
	secret : settings.cookieSecret,
	key : settings.db,
	cookie : {maxAge:30*24*60*60*1000},
	store : new MongoStore({
		db : settings.db
	})
}));

app.use(app.router);
app.use(express.static(path.join(__dirname, '/public')));

app.use(function(err,req,res,next){
	var meta = '[' + new Date() + ']'+req.url+'\n';
	errLog.write(meta+errStack+'\n');
	next();
});

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

routes(app);
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
