const express =require("express");
const path=require("path");
const { isAdmin, isSupplier } = require("../middleware/authMiddleware");
const router=express.Router();
router.get('/register',(req,res)=>{
    res.render('register',{title:'Register Page'});
});
router.get('/login',(req,res)=>{
    res.render('login',{title:"login page"});
});
router.get('/admin/dashboard',isAdmin,(req,res)=>{
    res.render('adminDashboard',{currUser : req.session.user});
});
router.get('/supplier/dashboard',isSupplier,(req,res)=>{
    res.render('supplierDashboard',{currUser :req.session.user});
});
module.exports=router;