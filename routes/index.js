
/*
 * GET home page.
 */
var crypto = require('crypto');
var fs = require('fs');
var User = require('../models/user.js');
var Post = require('../models/post.js');
var Comment = require('../models/comment.js');

module.exports = function(app){
	//获取主页
	app.get('/',function(req,res){
		//判断是否是第一页，并把请求的页数转换成number类型
		var page = req.query.p ? parseInt(req.query.p) : 1;
		Post.getTen(null,page,function(err,posts,total){
			if(err){
				posts = [];
			}
			res.render('index',{
				title:'主页',
				user:req.session.user,
				posts:posts,
				page:page,
				isFirstPage:(page-1)==0,
				isLastPage:((page-1)*10+posts.length)==total, //posts指的是最后一页的文章数目
				success:req.flash('success').toString(),
				error:req.flash('error').toString()
			});
		});
	});
	
	//获取注册页面
	app.get('/reg',checkNotLogin);
	app.get('/reg',function(req,res){
		res.render('reg',{
			title:'注册',
			user :req.session.user,
			success:req.flash('success').toString(),
			error:req.flash('error').toString()
			});
	});
	
	//提交注册页面
	app.post('/reg',checkNotLogin);
	app.post('/reg',function(req,res){
		var name = req.body.name,
			password = req.body.password,
			password_re = req.body['password-repeat'];
		//检查所输入的密码是否一致
		if(password != password_re){
			req.flash('error','两次输入的密码不一致');
			return res.redirect('/reg');
		}
		//生成加密md5密码
		var md5 = crypto.createHash('md5'),
			password = md5.update(req.body.password).digest('hex');
		var newUser = new User({
			    name : req.body.name,
				password : password,
				email : req.body.email
		});
		//检查用户名是否已经存在
		User.get(newUser.name,function(err,user){
			if(user){
				req.flash('error','用户名已经存在');
				return res.redirect('/reg');
			}
			//如果不存在则插入用户
			newUser.save(function(err,user){
				if(err){
					req.flash('error',err);
					return res.redirect('/reg');
				}
				req.session.user = user; //用户信息存入session
				req.flash('success','注册成功');
				res.redirect('/');
			});
		});
	});
	//获取登录页面
	app.get('/login',checkNotLogin);
	app.get('/login',function(req,res){
		res.render('login',{
			title:'登录',
			user :req.session.user,
			success:req.flash('success').toString(),
			error:req.flash('error').toString()
			});
	});
	
	//登录信息提交
	app.post('/login',checkNotLogin);
	app.post('/login',function(req,res){
		//生成加密md5密码
		var md5 = crypto.createHash('md5');
			password = md5.update(req.body.password).digest('hex');
		//检查用户是否存在
		User.get(req.body.name,function(err,user){
			if(!user){
				req.flash('error','用户名不存在');
				res.redirect('/login');
			}
			if(user.password != password){
				req.flash('error','密码错误');
				res.flash('/login');
			}
			//用户名和密码都匹配时，将信息存入session
			req.session.user = user;
			req.flash('success','登录成功');
			res.redirect('/');
		});
	});
	
	//获取发表文章的页面
	app.get('/post', checkLogin);
	app.get('/post', function (req, res) {
		res.render('post', {
			title: '发表',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});
	
	//发表文章
	app.post('/post',checkLogin);
	app.post('/post',function(req,res){
		var currentUser = req.session.user,
			tags = [{"tag":req.body.tag1},{"tag":req.body.tag2},{"tag":req.body.tag3}];
			post = new Post(currentUser.name, currentUser.head, req.body.title, tags, req.body.post);
		post.save(function(err){
			if(err){
				req.flash('error',err);
				return res.redirect('/');
			}
			req.flash('success','发表成功');
			res.redirect('/');
		});
	
	});
	
	//登出系统
	app.get('/logout',function(req,res){
		req.session.user= null;
		req.flash('success','登出成功');
		res.redirect('/');
	});
	app.get('/upload',checkLogin);
	app.get('/upload',function(req,res){
		res.render('upload',{
			title:'上传',
			user:req.session.user,
			success:req.flash('success').toString(),
			error:req.flash('error').toString()
		});
	});
	
	//上传文件（目前有问题没有实现）
	app.post('/upload',checkLogin);
	app.post('/upload',function(req,res){
		for(var i in  req.files){
			if(req.files[i].size == 0){
				// 使用同步方式删除一个文件
				fs.unlinkSync(req.files[i].path);
				console.log('successfully remove a empty file!');
			}
			else{
				var target_path = './public/images'+req.files[i].name;
				// 使用同步方式重命名一个文件
				fs.renameSync(req.files[i].path,target_path);
				console.log('successfully rename a  file!');
			}
		}
		req.flash('success','上传文件成功');
		res.redirect('/');
	});
	//获取文章存档信息
	app.get('/archive',function(req,res){
		Post.getArchive(function(err,posts){
			if(err){
				req.flash('error',err);
				return res.redirect('/');
			}
			res.render('archive',{
				title : '存档',
				user : req.session.user,
				posts : posts,
				success : req.flash('success').toString(),
				error : req.flash('success').toString()
			});
		});
	});
	//获取所有的标签
	app.get('/tags',function(req,res){
		Post.getTags(function(err,posts){
			if(err){
				req.flash('error',err);
				return res.redirect('/');
			}
			res.render('tags',{
				title : '标签',
				posts : posts,
				user : req.session.user,
				success : req.flash('success').toString(),
				error : req.flash('error').toString()
			});
		});
	});
	//获取特定标签的所有文章
	app.get('/tags/:tag',function(req,res){
		Post.getTag(req.params.tag,function(err,posts){
			if(err){
				req.flash('error',err);
				return res.redirect('/');
			}
			res.render('tag',{
				title : 'TAG:'+req.params.tag,
				user : req.session.user,
				posts : posts,
				success : req.flash('success').toString(),
				error : req.flash('success').toString()
			});
		});
	});
	//获取友情链接页面
	app.get('/links',function(req,res){
		res.render('links',{
			title : '友情链接',
			user : req.session.user,
			success : req.flash('success').toString(),
			error : req.flash('error').toString()
		});
	});
	//获取通过关键字检索的所有文章
	app.get('/search',function(req,res){
		Post.search(req.query.keyword,function(err,posts){
			if(err){
				req.flash('error',err);
				return res.redirect('/');
			}
			res.render('search',{
				title : 'SEARCH:'+req.query.keyword,
				posts : posts,
				user : req.session.user,
				success : req.flash('success').toString(),
				error : req.flash('error').toString()
			});
		});
	});
	
	//获取一个用户的所有文章（每个页面10篇文章）
	app.get('/u/:name',function(req,res){
		var page = req.query.p ? parseInt(req.query.p) : 1;
		//检查用户是否存在
		User.get(req.params.name,function(err,user){
			if(!user){
				req.flash('error','用户名不存在');
				return res.redirect('/'); //用户不存在，跳转到主页
			}
			//查询并返回该用户的page页的10篇文章
			Post.getTen(user.name,page,function(err,posts,total){
				if(err){
					req.flash('error',err);
					res.redirect('/');
				}
				res.render('user',{
					title:user.name,
					posts : posts,
					page : page,
					isFirstPage : (page-1)==0,
					isLastPage : ((page-1)*10+posts.length)==total,
					user : req.session.user,
					success : req.flash('success').toString(),
					error:req.flash('error').toString()
				});
			});
		});
	});
    
	//获取一篇文章的详细信息
	app.get('/u/:name/:day/:title',function(req,res){
		Post.getOne(req.params.name,req.params.day,req.params.title,function(err,post){
			if(err){
				req.flash('error',err);
				return res.redirect('/');
			}
			res.render('article',{
				title: req.params.title,
				user : req.session.user,
				post : post,
				success : req.flash('success').toString(),
				error : req.flash('error').toString()
			});
		});
	});
	//存储留言
	app.post('/u/:name/:day/:title',function(req,res){
		var date = new Date(),
			time = date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate()+' '+date.getHours()+':'+date.getMinutes();
		var md5 = crypto.createHash('md5');
		var email_MD5 = md5.update(req.body.email.toLowerCase()).digest('hex');
		var head = 'http://www.gravatar.com/avatar/'+email_MD5+'?s=50';
		var comment ={
			name : req.body.name,
			head : head,
			email : req.body.email,
			website : req.body.website,
			time : time,
			content : req.body.content
		};
		var newComment = new Comment(req.params.name,req.params.day,req.params.title,comment);
		newComment.save(function(err){
			if(err){
				req.flash('error',err);
				return res.redirect('/');
			}
			req.flash('success','留言成功');
			return res.redirect('back');
		});
	});
	
	//获取编辑页面并获取所要编辑的文章信息
	app.get('/edit/:name/:day/title',checkLogin);
	app.get('/edit/:name/:day/:title',function(req,res){
		var currentUser = req.session.user;
		Post.edit(currentUser.name,req.params.day,req.params.title,function(err,post){
			if(err){
				req.flash('error',err);
				return res.redirect('back');
			}
			res.render('edit',{
				title : req.params.title,
				post : post ,
				user : req.session.user,
				success : req.flash('success').toString(),
				error : req.flash('error').toString()
			});
		});
	});
	
	//获取转载的文章
	app.get('/reprint/:name/:day/:title',checkLogin);
	app.get('/reprint/:name/:day/:title',function(req,res){
		Post.edit(req.params.name,req.params.day,req.params.title,function(err,post){
			if(err){
				req.flash('error',err);
				return res.redirect(back);
			}
			var currentUser = req.session.user;
			var reprint_from = {
				name : post.name,
				day : post.time.day,
				title : post.title
			};
			var reprint_to = {
				name : currentUser.name,
				head : currentUser.head
			};
			Post.reprint(reprint_from,reprint_to,function(err,post){
				if(err){
					req.flash('error',err);
					return res.redirect('back');
				}
				req.flash('success','转载成功');
				var url = '/u/'+post.name+'/'+post.time.day+'/'+post.title;
				//跳转到转载后的文章页面
				res.redirect(url);
			});
		});
	});
	
	//提交编辑文章页面
	app.post('/edit/:name/:day/:title',checkLogin);
	app.post('/edit/:name/:day/:title',function(req,res){
		var currentUser = req.session.user;
		Post.update(currentUser.name,req.params.day,req.params.title,req.body.post,function(err){
			var url = '/u/'+req.params.name+'/'+req.params.day+'/'+req.params.title;
			if(err){
				req.flash('error',err);
				return res.redirect(url);
			}
			req.flash('success','修改成功');
			res.redirect(url);
		});
	});
	
	//进行删除文章操作
	app.get('/remove/:name/:day/:title',function(req,res){
		var currentUser = req.session.user;
		Post.remove(currentUser.name,req.params.day,req.params.title,function(err){
			if(err){
				req.flash('error',err);
				return res.redirect('back');
			}
			req.flash('success','删除成功');
			return res.redirect('/');
		});
	});

	//增加404页面
	app.use(function(req,res){
		res.render('404');
	});
	
	function checkLogin(req,res,next){
		if(!req.session.user){
			req.flash('error','用户没有登录，请先登录');
			res.redirect('/login');
			}	
		next();
	}

	function checkNotLogin(req,res,next){
		if(req.body.user){
			req.flash('error','用户已经存在');
			res.redirect('back');
		}
		next();
	}
};

