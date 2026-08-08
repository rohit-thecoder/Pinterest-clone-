var express = require("express");
var router = express.Router();
const userModal = require("./users");
const postModel = require("./post")
const passport = require("passport");
const localStrategy = require("passport-local");
const upload = require("./multer");

passport.use(new localStrategy(userModal.authenticate()));

router.get("/", function (req, res, next) {
  res.render("index", { nav: false });
});

router.get("/register", function (req, res, next) {
  res.render("register", { nav: false });
});

router.get("/profile", isLoggedIn, async function (req, res, next) {
  const user = await userModal
              .findOne({ username: req.session.passport.user })
              .populate("posts")
  res.render("profile", { user, nav: true });
});

router.get("/show/posts", isLoggedIn, async function (req, res, next) {
  const user = await userModal
              .findOne({ username: req.session.passport.user })
              .populate("posts")
  res.render("show", { user, nav: true });
});

router.get("/feed", isLoggedIn, async function (req, res, next) {
  const user = await userModal.findOne({ username: req.session.passport.user })
  const posts = await postModel.find()
  .populate("user")            
  res.render("feed", { user, posts, nav: true });
});

router.get("/edit", isLoggedIn, async function (req, res, next) {
  const user = await userModal.findOne({ username: req.session.passport.user });
  res.render("edit", { user, nav: true });
});


router.post("/edit", isLoggedIn, async (req, res) => {
  const { name, username } = req.body;

  await userModal.findOneAndUpdate(
    { username: req.session.passport.user },
    { name, username }
  );

  // Update username in session also
  req.session.passport.user = username;

  res.redirect("/profile");
});


router.get("/add", isLoggedIn, async function (req, res, next) {
  const user = await userModal.findOne({ username: req.session.passport.user });
  res.render("add", { user, nav: true });
});

router.post("/createpost", upload.single("postimage"), isLoggedIn, async function (req, res, next) {
  const user = await userModal.findOne({ username: req.session.passport.user });
  const post = await postModel.create({
    user: user._id,
    title: req.body.title,
    description: req.body.description,
    image: req.file.filename,
  });

  user.posts.push(post._id);
  await user.save()
  res.redirect("/profile");
});

router.post(
  "/fileupload",
  isLoggedIn,
  upload.single("image"),
  async function (req, res, next) {
    const user = await userModal.findOne({
      username: req.session.passport.user,
    });
    user.profileImage = req.file.filename;
    await user.save();
    res.redirect("/profile");
  }
);

router.post("/register", function (req, res, next) {
  const data = new userModal({
    username: req.body.username,
    name: req.body.fullname,
    email: req.body.email,
    contact: req.body.contact,
  });
  userModal.register(data, req.body.password).then(function () {
    passport.authenticate("local")(req, res, function () {
      res.redirect("/profile");
    });
  });
});

router.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/",
    successRedirect: "/profile",
  }),
  function (req, res, next) {}
);

router.post("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

router.get("/forgot-password", function(req, res) {
  res.render("forgot-password", { nav: false });
});

router.post("/forgot-password", async function(req, res) {
  const { contact, username, password, cpassword } = req.body;

  if (password !== cpassword) {
    return res.send("Passwords do not match");
  }

  const user = await userModal.findOne({ 
    contact: contact,
    username: username
  });

  if (!user) {
    return res.send("User not found!!");
  }

  // passport-local-mongoose function
  user.setPassword(password, async function(err) {
    if (err) return res.send(err.message);

    await user.save();
    res.redirect("/");
  });
});


function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else res.redirect("/");
}

module.exports = router;
