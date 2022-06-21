//jshint esversion:6
require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
// const md5 = require("md5");
// const bcrypt = require("bcrypt");
// const saltRound = 10;
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const GoogleStrategy = require('passport-google-oauth20').Strategy;
const facebookStrategy = require("passport-facebook").Strategy;
const findOrCreate = require('mongoose-findorcreate')

const app = express();
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
//setup session
app.use(session({
  secret:process.env.SECRET,
  resave:false,
  saveUninitialized:false
}));
//initialize passport, use passport session
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB");
const userSchema = new mongoose.Schema({
  email:String,
  password:String,
  googleId:String,
  facebookId:String
});
//let our userSchema use passportLocalMongoose plugin
userSchema.plugin(passportLocalMongoose);  //hash and crypt data for us
userSchema.plugin(findOrCreate);
// const secret = "this is the secret encrypt";
// userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:["password"]});
const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
  },
  function(accessToken, refreshToken, profile, cb) {

    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

passport.use(new facebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/",(req, res)=>{
  res.render("home");
});

app.get("/register",(req, res)=>{
  res.render("register");
});

app.get("/login",(req, res)=>{
  res.render("login");
});

app.get("/secrets",(req, res)=>{
  if(req.isAuthenticated()){
    res.render("secrets");
  }else{
    res.redirect("/login");
  }
});

app.get("/logout",(req, res)=>{
  req.logout((err)=>{
    if(err){
      console.log(err);
    }else{
      res.redirect("/");
    }
  });
});

app.get("/auth/google",
  passport.authenticate("google",{scope:["profile"]}));

app.get("/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect secret page.
    res.redirect('/secrets');
  });

app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
});
app.post("/register",(req, res)=>{
  const newuser = new User({
    username:req.body.username,
    password:req.body.password
  });
  //the register method come from passportLocalMongoose
  User.register(newuser,req.body.password,(err, user)=>{
    if(err){
      console.log(err);
      res.redirect("/register");
    }
    else{
      passport.authenticate("local")(req, res, ()=>{
        res.redirect("/secrets");
      });
    }
  });
});
  // bcrypt.hash(req.body.password,saltRound,(err, hash)=>{
  //   const newUser = new User({
  //     email:req.body.username,
  //     password:hash
  //   });
  //   newUser.save((err)=>{
  //     if(err){
  //       console.log(err);
  //     }else{
  //       console.log("successfully added!")
  //       res.render("secrets");
  //     }
  //   });
  // });



app.post("/login",(req, res)=>{
  const user = new User({
    username:req.body.username,
    password:req.body.password
  });

  req.login(user,function(err){
    if(err){
      console.log(err);
      res.send(err);
    }else{
      passport.authenticate("local")(req, res, function(){
        res.redirect("secrets");
      });
    }
  });
  // const email = req.body.username;
  // const password = req.body.password;
  //
  // User.findOne({email:email},(err, foundResult)=>{
  //   if(!err){
  //     if(foundResult){
  //       bcrypt.compare(password, foundResult.password,(err, result)=>{
  //         if(result === true){
  //           res.render("secrets");
  //         }else{
  //           res.send("wrong password!");
  //         }
  //       });
  //     }
  //     else{
  //       res.send("No user match!");
  //     }
  //   }
  // });
});

app.listen(3000, ()=>{
  console.log("Started listening on port 3000");
});
