if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}
const express = require('express');
path = require('path');
const app = express();
const bcrypt = require('bcrypt');
const passport = require('passport');
const initializePassport = require('./passport-config')
const flash = require('express-flash');
const session = require('cookie-session');
const methodOverride = require('method-override');
const mongo = require('mongodb');
const MongoClient = require('mongodb').MongoClient;
const passVs = require('./pass')
const fetch = require('node-fetch');
const bodyParser = require('body-parser');
const request = require('request-promise');
const port = process.env.PORT || 5000
let registerFlag = true;


let emailErrV = ''
let captchaErrV = ''
// PASTE YOUR DATABASE URL HERE:
const url = passVs.dbUrl;

const databaseName = "mydb";
let users = []
MongoClient.connect(url, { useNewUrlParser: true }, (error, client) => {
  if (error) {
      return console.log("Connection failed for some reason");
  }
  console.log("Connection established - All well");
  const db = client.db(databaseName);
  const DBcollection = db.collection('users').find()
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
// app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(flash());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  keys: ['x', 'y']
}))
app.use(passport.initialize());
app.use(passport.session())
app.use(methodOverride('_method'))

app.get('/', checkAuthenticated, (req, res) => {
  res.render('index.ejs', { name: req.user.name })
  emailErrV = ""
  captchaErrV = ""
})
app.get('/login', checkNotAuthenticated, (req, res) => {
  res.render('login.ejs')
  emailErrV = ""
  captchaErrV = ""
})
app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}))
app.get('/register', checkNotAuthenticated, (req, res) => {
  res.render('register.ejs', {emailErr: emailErrV, captchaErr: captchaErrV, captcha: passVs.recaptchaKey})
  MongoClient.connect(url, { useNewUrlParser: true }, (error, client) => {
    if (error) {
        return console.log("Connection failed for some reason");
    }
    console.log("Connection established - All well");
    const db = client.db(databaseName);
    const DBcollection = db.collection('users').find()
    
    DBcollection.forEach(function (data, err) {
        users.push(data)
    })
    // console.log(users)
});
})
function search(nameKey, myArray){
  for (var i=0; i < myArray.length; i++) {
      if (myArray[i].name === nameKey) {
          return myArray[i];
      }
  }
}


app.post('/register', checkNotAuthenticated, async (req, res) => {
  try {
      if(!req.body.captcha){
          console.log("err");
          console.log("captcha not checked")
      }

      const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${passVs.serverCaptchaKey}&response=${req.body.captcha}`;

      const checkCaptcha = await request(verifyUrl,(err,response,body)=>{

          if(err){console.log(err); }

          body = JSON.parse(body);
          if(body.score > 0.5) {
              console.log("captcha sucess! score: " + body.score)
              return true
          }
          if(body.score < 0.5) {
              console.log("captcha failed! score: " + body.score)
              return false
          }

      })



      if(checkCaptcha) {
          const hashedPassword = await bcrypt.hash(req.body.password, 10)
          await MongoClient.connect(url, function(err, client) {
              if (err) throw err;
              const db = client.db(databaseName);
              if (!users.find(o => o.email.toLowerCase() === req.body.email.toLowerCase())) {
                console.log('email: ' + users.find(o => o.email.toLowerCase() === req.body.email.toLowerCase()))
                  const myobj = { name: req.body.name, email: req.body.email, password: hashedPassword };
                  if (registerFlag) {
                  db.collection('users').insertOne(myobj, function(err, res) {
                      if (err) throw err;
                      console.log("1 record inserted");
                      // client.close();
                      registerFlag = false
                  })
                }
                  setTimeout(() => {registerFlag = true}, 1000)
              }
          });
          await MongoClient.connect(url, { useNewUrlParser: true }, (error, client) => {
            if (error) {
                return console.log("Connection failed for some reason");
            }
            console.log("Connection established - All well");
            const db = client.db(databaseName);
            const DBcollection = db.collection('users').find()
            
            DBcollection.forEach(function (data, err) {
                users.push(data)
            })
            // console.log(users)
        });
          
          initializePassport(passport,
              email => {return users.find(user => user.email === email)},
              id => users.find(user => user.id === id)
          );
          if (users.find(o => o.email.toLowerCase() === req.body.email.toLowerCase())) {
              emailErrV = "This Email is Already Taken"
              res.redirect('/register')
          } else {
              emailErrV = ""
              captchaErrV = ""
              res.redirect('/login')
          }
      } else {
          captchaErrV = "Recaptcha verification failed!"
          res.redirect('/register')
      }
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
app.listen(port)