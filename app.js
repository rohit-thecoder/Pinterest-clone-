const express = require("express");
const app = express();
const path = require("path");
const expressSession = require("express-session");
const indexRouter = require("./routes/index");
const userRouter = require("./routes/users");
const passport = require("passport");
const flash = require("connect-flash");

// ---------------- SESSION CONFIG ----------------
app.use(expressSession({
    resave: false,
    saveUninitialized: false,
    secret: "hey hey"
}));

// ---------------- FLASH ----------------
app.use(flash());

// Pass flash messages to every view
app.use(function(req, res, next){
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

// ---------------- VIEW ENGINE ----------------
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ---------------- MIDDLEWARE ----------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------------- STATIC ----------------
app.use(express.static(path.join(__dirname, "public")));

// ---------------- PASSPORT ----------------
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(userRouter.serializeUser());
passport.deserializeUser(userRouter.deserializeUser());

// ---------------- ROUTES ----------------
app.use("/", indexRouter);
app.use("/users", userRouter);

// ---------------- START SERVER ----------------
app.listen(3001, function () {
    console.log("Server running on port 3001");
});
