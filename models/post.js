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

//存储一篇文章的有关信息
Post.prototype.save = function(callback){
	var date = new Date();
	//存储各种时间格式方便以后使用
	var time = {
		date : date,
		year : date.getFullYear(),
		month : date.getFullYear()+'-'+(date.getMonth()+1),
		day : date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate(),
		hour : date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate()+'-'+date.getHours(),
		minute : date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate()+' '+date.getHours()+':'+date.getMinutes()
	};
	//要存入数据库的文档
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
	//打开数据库
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}
		//读取posts集合
		db.collection('posts',function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			//将信息插入posts集合
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

//获取10篇文章
Post.getTen = function(name,page,callback){
	//打开数据库
	mongodb.open(function(err,db){
		if(err){
			mongodb.close();
			return callback(err);
		}
		//读取posts集合
		db.collection('posts',function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			var query={};
			if(name){
				query.name = name;
			}
			//根据query对象查询文章
			collection.count(query,function(err,total){
					//根据query对象查询，并跳过前边的（page-1）*10个结果，返回最后的10个结果
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
					return callback(null,docs,total);//成功，已数组返回查询结果
				});
			});
		});
	});
};

//获取一篇文章的准确信息
Post.getOne = function(name,day,title,callback){
	//打开数据库
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}
		//读取posts集合
		db.collection('posts',function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			//根据用户名，文章发表日期，文章标题进行查询
			collection.findOne({
				"name" : name,
				"time.day" : day,
				"title" : title
			},function(err,doc){
				mongodb.close();
				if(err){
					return callback(err);
				}
				//解析HTML为markdown文件
				if(doc){
					doc.post = markdown.toHTML(doc.post);
					doc.comments.forEach(function(comment){
						comment.content = markdown.toHTML(comment.content);
					});
				}
				callback(null,doc);
			});
			
			//每访问一次，pv的值加1
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

//返回原始发表的文章内容
Post.edit=function(name,day,title,callback){
	//打开数据库
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}
		//读取posts集合
		db.collection('posts',function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			//查找文档,根据用户名，文章发表日期，文章标题进行查询
			collection.findOne({
				"name" : name,
				"time.day":day,
				"title" : title
			},function(err,doc){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null,doc);//返回查找的一篇文章
				console.log('doc='+doc);
			});
		});
	});
};

//更新一篇文章
Post.update = function(name,day,title,post,callback){
	//打开数据库
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}
		//读取posts集合
		db.collection('posts',function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			//更新数据
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

//删除一篇文章
Post.remove = function(name,day,title,callback){
	//打开数据库
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}
		//读取posts集合
		db.collection('posts',function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			//根据用户名，文章发表日期，文章标题删除一篇文章
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
//返回所有文章存档信息
Post.getArchive = function(callback){
	//打开数据库
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}
		//读取posts集合
		db.collection('posts',function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			//根据用户名，文章发表日期，文章标题查询所有的文章存档
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
//返回所有标签
Post.getTags = function(callback){
	//打开数据库
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}
		//读取posts集合
		db.collection('posts',function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			//distinct用来找出给定键的所有不同值,避免重复查找
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
//返回特定标签的所有文章
Post.getTag = function(tag,callback){
	//打开数据库
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}
		//读取posts集合
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

//返回通过标题关键字查找的所有文章
Post.search = function(keyword,callback){
	//打开数据库
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}
		//读取posts集合
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
//转载一篇文章
Post.reprint = function(reprint_from,reprint_to,callback){
	//打开数据库
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}
		//读取posts集合
		db.collection('posts',function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			//找到被转载的原文档
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
				//存储各种时间格式方便以后使用
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
				doc.title = (doc.title.search(/[转载]/) > -1) ? doc.title : "[转载]"+doc.title;
				doc.comments = [];
				doc.reprint_info = {'reprint_from':reprint_from};
				doc.pv = 0;
				//更新被转载的原文档的reprint_from 的 reprint_to
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
				//将转载后的副本修改后存入数据库，并返回存储后的文档
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