
const path = require('path');
const session = require('express-session');

const express = require('express');

// маршруты блога
const blogRoutes = require('./routes/blog');

const AuthRoutes = require('./routes/Auth.js');


const db = require('./data/database');


const app = express();


app.set('view engine', 'ejs');


app.set('views', path.join(__dirname, 'views'));


app.use(express.urlencoded({ extended: true }));


app.use(express.static('public'));
app.use(session({
  secret: '577e5e885653d966b63b8fae281346f0a30bd01051005505fd5af859b0bcf8a0f9d85d20d0189d0cdebcb0c799096134e6138c2ce14217f860b06ff484af9a23', // Change this to a secret key
  resave: false,
  saveUninitialized: true
}));

app.use(blogRoutes);
app.use(AuthRoutes);
app.use(express.static('bublic'));


app.use(function (error, req, res, next) {
  console.log(error); 
  res.redirect('/login'); 
});


db.connectToDatabase().then(function () {
  app.listen(5000);
});
