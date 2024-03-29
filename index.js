if(process.env.NODE_ENV !="production"){
    require("dotenv").config();
}


const express=require("express");
const app=express();
const path=require("path");
const methodOverride=require("method-override");
const engine = require("ejs-mate");
app.engine('ejs',engine);
app.set("views",path.join(__dirname,"views"));
app.set("view engine","ejs");
app.use(express.static(path.join(__dirname,"public")));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride('_method'));
const mongoose = require('mongoose');
const ExpressError=require("./utils/expresserror.js");
const session=require("express-session");
const MongoStore=require("connect-mongo");
const flash=require("connect-flash");
const passport=require("passport");
const LocalStrategy=require("passport-local");
const User=require("./models/user.js");

const listingRouter=require("./routes/listing.js");
const reviewRouter=require("./routes/review.js");
const userRouter=require("./routes/user.js");

const dbURL=process.env.ATLASDB_URL;

const store = MongoStore.create({
    mongoUrl:dbURL,
    crypto:{
        secret:process.env.SECRET,
    },  
    touchAfter: 24*3600,
});

store.on("error",()=>{
    console.log("error in mongo session store",err);
})

const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie:{
        expires:Date.now()+7*24*60*60*1000,
        maxAge:7*24*60*60*1000,
        httpOnly:true  
    }
};

// app.get("/", (req, res) => {
//     res.send("root is running");
// });


app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
    res.locals.success=req.flash("success");
    res.locals.error=req.flash("error");
    res.locals.currUser=req.user;
    next();
});

// app.get('/demouser',async (req,res)=>{
//     let fakeUser=new User({
//         email:"student@gmail.com",
//         username:"delta-student"
//     });
//     let registeredUser=await User.register(fakeUser,"helloworld");
//     res.send(registeredUser);
// });

app.get("/privacy",(req,res)=>{
    res.render("privacy.ejs");
});

app.get("/terms",(req,res)=>{
    res.render("terms.ejs");
});

app.use("/listings",listingRouter);
app.use("/listings/:id/reviews",reviewRouter);
app.use('/',userRouter);



main().then(()=>{
    console.log("connection successful");
})
.catch((err)=>console.log(err));


async function main() {
    // await mongoose.connect('mongodb://127.0.0.1:27017/airbnb');
    await mongoose.connect(dbURL);
}

app.all("*", (req, res) => {
    res.status(404).render("error.ejs", { err: new ExpressError(404, "Page not found!!") });
});

app.use((err,req,res,next)=>{
   let {statusCode=500,message="Something went wrong"}=err;
   res.status(statusCode).render("error.ejs",{err});
});
app.listen(8080,()=>{
    console.log("server is listening");
});
