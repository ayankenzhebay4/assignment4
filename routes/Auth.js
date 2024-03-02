const express = require('express');
const bcrypt = require('bcrypt');

const db = require('../data/database');
const nodemailer = require("nodemailer");
const readline = require("readline");
const validator = require("email-validator");
require("dotenv").config();

const router = express.Router();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.USER,
        pass: process.env.APP_PASSWORD,
    },
});
const isValidEmail = (email) => {
    return validator.validate(email);
};

// Set up session middleware


// Route for serving the login page
router.get('/login', (req, res) => {
  res.render('login.ejs'); // Assuming you have a login.ejs template in your views directory
});

// Route for serving the registration page
router.get('/register', (req, res) => {
  res.render('register.ejs'); // Assuming you have a register.ejs template in your views directory
});

// Registration route
router.post('/register', async (req, res) => {
  const { firstName, lastName, username, password, email } = req.body;
  // Check if username is already taken
  if(!isValidEmail(email)){
    return res.status(400).json({message:'email wrong'});
  }
  recipients = []
  recipients[0] = email;
  message = "You have registered";
  subject = "registration";
  const mailOptions = {
    from: {
        name: "Ayan Kenzhebay",
        address: process.env.USER
    },
    to: recipients,
    subject: subject,
    text: message,
    html: `<b>${message}</b>`
    };
    await sendEmail(transporter, mailOptions)
  const existingUser = await db.getDb().collection('users').findOne({ username });
  if (existingUser) {
    return res.status(400).json({ message: 'Username already exists' });
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Store user in the database
  var role = "Regular User"
  await db.getDb().collection('users').insertOne({ firstName, lastName, username, password: hashedPassword, role, email });

  res.redirect("/login");
});

// Login route
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Check if user exists
  const user = await db.getDb().collection('users').findOne({ username });
  if (!user) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }

  // Verify password
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }

  // Store user information in session
    req.session.user = user;

  // Authentication successful
  res.redirect("/posts");
});

const sendEmail = async (transporter, mailOptions) => {
    try {
        await transporter.sendMail(mailOptions);
        console.log("Email has been successfully sent!");
    } catch (error) {
        console.error("Error occurred while sending email:", error);
    }
};

// Authentication middleware
function authenticate(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
}

function isAdmin(req,res,next){
    if(req.session.user.role==="Admin"){
        next();
    }else{
        res.status(403).json({message: "you don't have access"});
    }
}

// Example route that requires authentication
router.get('/protected', isAdmin, (req, res) => {
  res.json({ message: 'This route is protected' });
});

router.get('/admin', isAdmin, (req, res) => {
    res.render('admin-page');
  });
  


  router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }
      res.redirect('/login');
    });
  });

  // Route for assigning roles to users
router.post('/admin/assign-role', authenticate, isAdmin, async (req, res) => {
    const { username, role } = req.body;
    
    // Update the user's role in the database
    await db.getDb().collection('users').updateOne({ username }, { $set: { role } });
    
    // Redirect back to the admin page or any other page as needed
    res.redirect('/admin');
});

module.exports = router;
