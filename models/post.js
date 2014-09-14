var mongodb = require('./db');
var markdown = require('markdown').markdown;

function Post(name,head,title,tags,post){
	this.name = name;
	this.head = head;
	this.title = title;
	this.tags = tags;
	this.post = post;
}
module.exports = Post;

//�洢һƪ���µ��й���Ϣ
Post.prototype.save = function(callback){
	var date = new Date();
	//�洢����ʱ���ʽ�����Ժ�ʹ��
	var time = {
		date : date,
		year : date.getFullYear(),
		month : date.getFullYear()+'-'+(date.getMonth()+1),
		day : date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate(),
		hour : date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate()+'-'+date.getHours(),
		minute : date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate()+' '+date.getHours()+':'+date.getMinutes()
	};
	//Ҫ�������ݿ���ĵ�
	var post = {
		name : this.name,
		head : this.head,
		time : time,
		title : this.title,
		tags : this.tags,
		post : this.post,
		comments : [],
		reprint_info : {},
		pv : 0
	};
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
			//����Ϣ����posts����
			collection.insert(post,{safe:true},function(err){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null);
			});
		});
	});
};

//��ȡ10ƪ����
Post.getTen = function(name,page,callback){
	//�����ݿ�
	mongodb.open(function(err,db){
		if(err){
			mongodb.close();
			return callback(err);
		}
		//��ȡposts����
		db.collection('posts',function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			var query={};
			if(name){
				query.name = name;
			}
			//����query�����ѯ����
			collection.count(query,function(err,total){
					//����query�����ѯ��������ǰ�ߵģ�page-1��*10���������������10�����
					collection.find(query,{
						skip : (page-1)*10,
						limit : 10
					}).sort({time:-1}).toArray(function(err,docs){
					mongodb.close();
					if(err){
						return callback(err);
					}
					docs.forEach(function(doc){
						doc.post = markdown.toHTML(doc.post);
					});
					return callback(null,docs,total);//�ɹ��������鷵�ز�ѯ���
				});
			});
		});
	});
};

//��ȡһƪ���µ�׼ȷ��Ϣ
Post.getOne = function(name,day,title,callback){
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
			//�����û��������·������ڣ����±�����в�ѯ
			collection.findOne({
				"name" : name,
				"time.day" : day,
				"title" : title
			},function(err,doc){
				mongodb.close();
				if(err){
					return callback(err);
				}
				//����HTMLΪmarkdown�ļ�
				if(doc){
					doc.post = markdown.toHTML(doc.post);
					doc.comments.forEach(function(comment){
						comment.content = markdown.toHTML(comment.content);
					});
				}
				callback(null,doc);
			});
			
			//ÿ����һ�Σ�pv��ֵ��1
			collection.update({
				'name' : name,
				'time.day' : day,
				'title' : title
			},{
				$inc : {'pv' : 1}
			},function(err,res){
				if(err){
					callback(err);
				}
			});
		});
	});
};

//����ԭʼ�������������
Post.edit=function(name,day,title,callback){
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
			//�����ĵ�,�����û��������·������ڣ����±�����в�ѯ
			collection.findOne({
				"name" : name,
				"time.day":day,
				"title" : title
			},function(err,doc){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null,doc);//���ز��ҵ�һƪ����
				console.log('doc='+doc);
			});
		});
	});
};

//����һƪ����
Post.update = function(name,day,title,post,callback){
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
			//��������
			collection.update({
				"name" : name,
				"time.day" : day,
				"title" : title,
			},
			{
				$set:{post:post}
			},function(err,result){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null);
			});
		});
	});
};

//ɾ��һƪ����
Post.remove = function(name,day,title,callback){
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
			//�����û��������·������ڣ����±���ɾ��һƪ����
			collection.remove({
				"name" : name,
				"time.day" : day,
				"title" : title
			},function(err,result){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null);
			});
		});
	});
};
//�����������´浵��Ϣ
Post.getArchive = function(callback){
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
			//�����û��������·������ڣ����±����ѯ���е����´浵
			collection.find({},{
				"name" : 1,
				"time" : 1,
				"title" : 1
			}).sort({time:-1}).toArray(function(err,docs){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null,docs);
			});
		});
	});
};
//�������б�ǩ
Post.getTags = function(callback){
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
			//distinct�����ҳ������������в�ֵͬ,�����ظ�����
			collection.distinct('tags.tag',function(err,docs){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null,docs);
			});
		});
	});
};
//�����ض���ǩ����������
Post.getTag = function(tag,callback){
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
			collection.find({
				'tags.tag':tag
				},{
				'name' : 1,
				'time' : 1,
				'title' : 1
			}).sort({
				time : -1
			}).toArray(function(err,docs){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(err,docs);
			});
		});
	});
};

//����ͨ������ؼ��ֲ��ҵ���������
Post.search = function(keyword,callback){
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
			var pattern = new RegExp("^.*" + keyword + ".*$","i");
			collection.find({
				'title' : pattern
			},{
				'name' : 1,
				'time' : 1,
				'title' :1
			}).sort({
				time:-1
			}).toArray(function(err,docs){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null,docs);
			});
		});
	});
};
//ת��һƪ����
Post.reprint = function(reprint_from,reprint_to,callback){
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
			//�ҵ���ת�ص�ԭ�ĵ�
			collection.findOne({
				"name" : reprint_from.name,
				"time.day" :reprint_from.day,
				"title" : reprint_from.title
			},function(err,doc){
				if(err){
					mongodb.close();
					return callback(err);
				}
				var date = new Date();
				//�洢����ʱ���ʽ�����Ժ�ʹ��
				var time = {
					date : date,
					year : date.getFullYear(),
					month : date.getFullYear()+'-'+(date.getMonth()+1),
					day : date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate(),
					hour : date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate()+'-'+date.getHours(),
					minute : date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate()+' '+date.getHours()+':'+date.getMinutes()
				};
				delete doc._id;
				
				doc.name = reprint_to.name;
				doc.head = reprint_to.head;
				doc.time = time;
				doc.title = (doc.title.search(/[ת��]/) > -1) ? doc.title : "[ת��]"+doc.title;
				doc.comments = [];
				doc.reprint_info = {'reprint_from':reprint_from};
				doc.pv = 0;
				//���±�ת�ص�ԭ�ĵ���reprint_from �� reprint_to
				collection.update({
					"name" : reprint_from.name,
					"time.day" :reprint_from.day,
					"title" : reprint_from.title
				},{
					$push : {
						"reprint_info.reprint_to" : {
							"name" : reprint_to.name,
							"day" : time.day,
							"title" : doc.title
						}
					}
				},function(err,result){
					if(err){
						mongodb.close();
						return  callback(err);
					}
				});
				//��ת�غ�ĸ����޸ĺ�������ݿ⣬�����ش洢����ĵ�
				collection.insert('doc',{
					safe : true
				},function(err,post){
					mongodb.close();
					if(err){
						return callback(err);
					}
					callback(err,post[0]);
				});
			});
		});
	});
};