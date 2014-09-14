var mongodb = require('./db');
var crypto = require('crypto');

function User(user){
	this.name = user.name;
	this.password = user.password;
	this.email = user.email;
}
module.exports = User;
//�洢�û���Ϣ
User.prototype.save = function(callback){
	var md5 = crypto.createHash('md5');
	var email_MD5 = md5.update(this.email.toLowerCase()).digest('hex');
	var head = "http://www.gravatar.com/avatar/"+email_MD5+"?s=60";
	//Ҫ�������ݿ���û��ĵ�
	var user = {
		name : this.name,
		password : this.password,
		email : this.email,
		head : head
	};
	//�����ݿ�
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}
		//��ȡusers����
		db.collection('users',function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			//��������
			collection.insert(user,{safe:true},function(err,user){
				mongodb.close();
				callback(null,user[0]);
			});
		});
	});
};

//��ȡ�û���Ϣ
User.get = function(name,callback){
	//�����ݿ�

	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}
		//��ȡusers����
		db.collection('users',function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			//�����û���ֵΪname��һ���ĵ�
			collection.findOne({name:name},function(err,user){
				mongodb.close();
				if(user){
					return callback(null,user);//�ɹ������ز�ѯ��Ϣ
				}
				callback(err);//����ʧ��ʱ������ʧ����Ϣ
			});
		});
	});
};