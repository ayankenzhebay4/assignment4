// Подключаем фреймворк Express для работы с веб-приложениями
const express = require('express');

// Подключаем модуль mongodb для работы с MongoDB
const mongodb = require('mongodb');

// Подключаем модуль database.js, который содержит логику для работы с базой данных
const db = require('../data/database');


// Создаем экземпляр маршрутизатора Express
const router = express.Router();

// Определяем переменную ObjectId для работы с идентификаторами MongoDB
const ObjectId = mongodb.ObjectId;

// Обработчик маршрута для перенаправления на страницу постов
router.get('/', function (req, res) {
  res.redirect('/posts');
});
router.get('/fact', function (req,res) {
  res.redirect('api1.html');
})
router.get('/joke', function (req,res) {
  res.redirect('api2.html');
})
router.get('/exchange', function (req,res) {
  res.redirect('api3.html');
})
// Обработчик маршрута для получения списка постов из базы данных и их отображения
router.get('/posts', async function (req, res) {
  const posts = await db.getDb().collection('posts').find({}).project({ title: 1, summary: 1, 'author.name': 1 }).toArray();
  res.render('posts-list', { posts: posts, user: req.session.user});
});

// Обработчик маршрута для отображения формы создания нового поста
router.get('/new-post', async function (req, res) {
  const authors = await db.getDb().collection('authors').find().toArray();
  res.render('create-post', { authors: authors , user:req.session.user});
});

// Обработчик маршрута для создания нового поста на основе данных из запроса
router.post('/posts', async function (request, response) {
  const authorId = new ObjectId(request.body.author);
  const author = await db.getDb().collection('authors').findOne({ _id: authorId });
  
  const newPost = {
    title: request.body.title,
    summary: request.body.summary,
    body: request.body.content,
    created_at: new Date(),
    author: {
      id: request.session.user._id,
      name: request.session.user.firstName
    }
  };

  await db.getDb().collection('posts').insertOne(newPost);
  response.redirect('/posts');
});

// Обработчик маршрута для отображения деталей конкретного поста
router.get('/post/:id', async function (request, response, next) {
  let postId = request.params.id;

  try {
    postId = new ObjectId(postId);
  } catch (error) {
    return response.status(404).render('404');
  }

  const post = await db.getDb().collection('posts').findOne({ _id: postId }, { summary: 0 });
  const author = await db.getDb().collection('users').findOne({ _id: new ObjectId(post.author.id) });

  if (!post || !author) {
    return response.status(404).render('404');
  }

  post.humanReadableDate = post.created_at.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  post.created_at = post.created_at.toISOString();

  response.render('post-detail', { post: post, author: author , user:request.session.user});
});

// Обработчик маршрута для отображения формы редактирования поста
router.get('/post/edit/:id', async function (request, response) {
  const postId = new ObjectId(request.params.id);
  const post = await db.getDb().collection('posts').findOne({ _id: postId }, { title: 1, summary: 1, body: 1 });
  if(post.author.id===request.session.user._id || request.session.user.role==="Admin"){
    
      response.render('update-post', { post: post , user:request.session.user});
    
  }
  else{
    response.status(403).send("you don't have access to this post");
  }
  if (!post) {
    return response.status(404).render('404');
  }
});

// Обработчик маршрута для обновления информации о посте на основе данных из запроса
router.post('/post/edit/:id', async function (request, response) {
  const postId = new ObjectId(request.params.id);
  const post = await db.getDb().collection('posts').findOne({ _id: postId }, { title: 1, summary: 1, body: 1 });
  
  await db.getDb().collection('posts').updateOne({ _id: postId }, {
    $set: {
      title: request.body.title,
      summary: request.body.summary,
      body: request.body.content
    }
  });
  response.redirect('/posts');
  
});

// Обработчик маршрута для удаления поста на основе данных из запроса
router.post('/post/delete/:id', async function (request, response) {
  const postId = new ObjectId(request.params.id);
  const post = await db.getDb().collection('posts').findOne({ _id: postId }, { title: 1, summary: 1, body: 1 });
  if(post.author.id===request.session.user._id || request.session.user.role==="Admin"){
    await db.getDb().collection('posts').deleteOne({ _id: postId });
  }else{
    response.status(403).send("you don't have access");
  }
  

  response.redirect('/posts');
});

// Route for rendering the admin page


function isAdmin(req,res,next){
  if(req.session.user.role==="Admin"){
    next();
  }else{
    res.status(403).send("unouksjhnlgfjk");
  }
}

// Экспортируем созданный маршрутизатор для использования в других частях приложения
module.exports = router;
