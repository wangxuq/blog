var settings = require('../settings'),
Connection = require('mongodb').Connection,
Db = require('mongodb').Db,
Server = require('mongodb').Server;

module.exports = new Db(settings.db,new Server(settings.host,Connection.DEFAULT_PORT,{}));