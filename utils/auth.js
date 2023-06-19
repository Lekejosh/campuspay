const passport = require("passport");
const User = require("../models/userModel");

const GoogleStrategy = require("passport-google-oauth2").Strategy;

passport.serializeUser(function (user, done) {
  done(null, user);
});
passport.deserializeUser(function (user, done) {
  done(null, user);
});


passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:4000/api/v1/user/sessions/google",
    },
    function (request, accessToken, refreshToken, profile, done) {
       
      return done(null, profile);
    }
  )
);

