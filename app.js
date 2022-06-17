//jshint esversion:6
require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const md5 = require("md5");

const app = express();
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/userDB");
const userSchema = new mongoose.Schema({
  email:String,
  password:String
});
// const secret = "this is the secret encrypt";
// userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:["password"]});
const User = mongoose.model("User", userSchema);

app.get("/",(req, res)=>{
  res.render("home");
});

app.get("/register",(req, res)=>{
  res.render("register");
});

app.get("/login",(req, res)=>{
  res.render("login");
});

app.post("/register",(req, res)=>{
  const newUser = new User({
    email:req.body.username,
    password:md5(req.body.password)
  });
  newUser.save((err)=>{
    if(err){
      console.log(err);
    }else{
      console.log("successfully added!")
      res.render("secrets");
    }
  });
});

app.post("/login",(req, res)=>{
  const email = req.body.username;
  const password = md5(req.body.password);

  User.findOne({email:email},(err, foundResult)=>{
    if(!err){
      if(foundResult){
        if(foundResult.password === password){
          res.render("secrets");
        }else{
          res.send("wrong password!");
        }
      }
      else{
        res.send("No user match!");
      }
    }
  });
});

app.listen(3000, ()=>{
  console.log("Started listening on port 3000");
});
