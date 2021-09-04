if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}
const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const passport = require('passport');
const initializePassport = require('./passport-config')
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');
const mongo = require('mongodb');
const mongoose = require('mongoose');
const MongoClient = require('mongodb').MongoClient;
// PASTE YOUR DATABASE URL HERE:  
const url = "";

const databaseName = "mydb";
let users = []
MongoClient.connect(url, { useNewUrlParser: true }, (error, client) => {
  if (error) {
    return console.log("Connection failed for some reason");
  }
  console.log("Connection established - All well");
  const db = client.db(databaseName);
  const DBcollection = db.collection('users').find()
  users = []
  DBcollection.forEach(function (data, err) {
  users.push(data)
  })
  console.log(users)
});


initializePassport(passport, 
  email => {return users.find(user => user.email === email)},
  id => users.find(user => user.id === id)
  );
  
  


app.set('view-engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}))
app.use(passport.initialize());
app.use(passport.session())
app.use(methodOverride('_method'))

app.get('/', checkAuthenticated, (req, res) => {
  res.render('index.ejs', { name: req.user.name })
})
app.get('/login', checkNotAuthenticated, (req, res) => {
  res.render('login.ejs')
})
app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}))
app.get('/register', checkNotAuthenticated, (req, res) => {
  res.render('register.ejs')
})
app.post('/register', checkNotAuthenticated, async (req, res) => {
 try {
   const hashedPassword = await bcrypt.hash(req.body.password, 10)
   MongoClient.connect(url, function(err, client) {  
    if (err) throw err; 
    const db = client.db(databaseName);
    const myobj = { name: req.body.name, email: req.body.email, password: hashedPassword };  
    db.collection('users').insertOne(myobj, function(err, res) {  
    if (err) throw err;  
    console.log("1 record inserted");  
    // client.close();  
    });  
    });
    MongoClient.connect(url, { useNewUrlParser: true }, (error, client) => {
      if (error) {
        return console.log("Connection failed for some reason");
      }
      console.log("Connection established - All well");
      const db = client.db(databaseName);
      const DBcollection = db.collection('users').find()
      users = []
      DBcollection.forEach(function (data, err) {
      users.push(data)
      })
      console.log(users)
    });
    initializePassport(passport, 
      email => {return users.find(user => user.email === email)},
      id => users.find(user => user.id === id)
      );
    res.redirect('/login')
 } catch (err) {
   console.log(err)
   res.redirect('/register')
 }
})
app.delete('/logout', (req,res) => {
  req.logOut()
  res.redirect('/login')
})

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }
  res.redirect('/login')
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    res.redirect('/')
  }
  next()
}
app.listen(3000)