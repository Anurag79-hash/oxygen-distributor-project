const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const MongoStore=require("connect-mongo");
const cors = require('cors');
const session=require("express-session");
const helmet = require('helmet');
const path = require('path');
const app=express();
dotenv.config();
// app.use(helmet());
app.use(express.static(path.join(__dirname,'public')));
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.set('views',path.join(__dirname,'views'));
app.set('view engine','ejs');
// console.log(User.find());.
// //Routes
// configure session
app.use(cors());
app.use(session({
  secret:process.env.SESSION_SECRET,
  resave:false,
  saveUninitialized:false,
  store:MongoStore.create({mongoUrl:process.env.MONGO_URI}),
  cookie:{
    sameSite:"none",
    secure:true,
    maxAge:1000*60*60}
}));
app.use((req, res, next) => {
  res.locals.currUser = req.session.user || null;
  next();
});

const authRoutes=require('./routes/authRoutes');
const pageRoutes=require('./routes/pageRoutes');
const adminRoutes=require('./routes/adminRoutes');
const supplierRoutes=require('./routes/supplierRoutes');
app.use('/supplier',supplierRoutes);
app.use('/api',authRoutes);
app.use('/',pageRoutes);
app.use('/admin',adminRoutes);
app.get('/',(req,res)=>{
  res.render('home');
});

app.use((req,res,next)=>{
  res.status(404).send("404 - Page not Found");
});
app.use((req,res,next)=>{
  res.header("Cache-Control","no-cache,no-store,must-revalidate");
  res.header("Pragma","no-cache");
  res.header("Expires","0");
  next();
})
app.listen(process.env.PORT||10000,()=>{
  console.log(`Server running of port ${process.env.PORT}`);
  connectMongo();
})
function connectMongo(){
  mongoose.connect(process.env.MONGO_URI).then(()=>console.log("MongoDB Connected")).catch(err=>console.log("Mongo Error",err))
}
