const express = require("express");
const session = require("express-session");
const router = express.Router();
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/user");

//persist user data after succesful authentication
passport.serializeUser(function (user, done) {
  done(null, user.id);
});

//retrieve user data from session
passport.deserializeUser(async (id, done) => {
  try {
    const userObject = await User.findById(id);
    const user = {
      _id: userObject._id,
      name: userObject.fullname,
      image: userObject.image,
    };
    done(null, userObject);
  } catch (err) {
    done(err, null);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async function (accessToken, refreshToken, profile, done) {
      const newUser = {
        name: profile.name.givenName,
        subname: profile.name.familyName,
        fullname: `${profile.name.givenName} ${profile.name.familyName}`,
        image: profile.photos[0].value,
        googleId: profile.id,
        email: profile.emails[0].value,
        password: "prueba",
      };
      try {
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          done(null, user);
        } else {
          user = await User.create(newUser);
          done(null, user);
        }
      } catch (error) {
        console.log(error);
      }
    }
  )
);

router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["email", "profile"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "http://localhost:5173/login",
    successRedirect: "http://localhost:5173",
  })
);

router.get("/login/check-auth", (req, res) => {
  if (req.isAuthenticated()) {
    const userAuthenticate = {
      _id: req.user._id,
      name: req.user.fullname,
      image: req.user.image,
    };
    return res.status(200).send({ message: "succes", user: userAuthenticate });
  } else {
    return res.status(401).send({ error: false, message: "Unauthorized" });
  }
});

router.get("/logout", (req, res, next) => {
  res.clearCookie("connect.sid");
  req.logout(function (err) {
    if (err) {
      console.error("Error al cerrar sesión:", err);
      return res.redirect("/login"); // Redirige a /login si hay un error al cerrar sesión
    }

    req.session.destroy(function (err) {
      if (err) {
        console.error("Error al destruir la sesión:", err);
        return res.redirect("/login"); // Redirige a /login si hay un error al destruir la sesión
      }

      // La sesión se ha destruido correctamente, ahora puedes redirigir al usuario
      res.redirect("http://localhost:5173/login");
    });
  });
});

module.exports = router;
