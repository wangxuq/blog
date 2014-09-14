var mongodb = require('./db');

function Comment(name,day,title,comment){
	this.name = name;
	this.day = day;
	this.title = title;
	this.comment = comment;
}

module.exports = Comment;
//�洢һ��������Ϣ
Comment.prototype.save = function(callback){
	//��������
	var name = this.name,
		day = this.day,
		title = this.title,
		comment = this.comment;
	//�����ݿ�
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}
		//��ȡposts����
		db.collection('posts',function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			//ͨ���û��������ڣ����±���������£�����һ�����۲��뵽comments������
			collection.update({
				"name" : name,
				"time.day" :day,
				"title" : title
			},{
				$push:{"comments":comment}
			},function(err,result){
				mongodb.close();
				callback(null);
			});
		});
	});
}