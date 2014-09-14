var mongodb = require('./db');
var crypto = require('crypto');

function User(user){
	this.name = user.name;
	this.password = user.password;
	this.email = user.email;
}
module.exports = User;
//存储用户信息
User.prototype.save = function(callback){
	var md5 = crypto.createHash('md5');
	var email_MD5 = md5.update(this.email.toLowerCase()).digest('hex');
	var head = "http://www.gravatar.com/avatar/"+email_MD5+"?s=60";
	//要存入数据库的用户文档
	var user = {
		name : this.name,
		password : this.password,
		email : this.email,
		head : head
	};
	//打开数据库
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}
		//读取users集合
		db.collection('users',function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			//插入数据
			collection.insert(user,{safe:true},function(err,user){
				mongodb.close();
				callback(null,user[0]);
			});
		});
	});
};

//读取用户信息
User.get = function(name,callback){
	//打开数据库

	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}
		//读取users集合
		db.collection('users',function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			//查找用户名值为name的一个文档
			collection.findOne({name:name},function(err,user){
				mongodb.close();
				if(user){
					return callback(null,user);//成功，返回查询信息
				}
				callback(err);//查找失败时，返回失败信息
			});
		});
	});
};