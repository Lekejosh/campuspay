/*
 * app.js
 * Created By Adeleke Joshua A.
 * 19/06/2023
 */

const express = require("express");
const app = express();
const cors = require("cors");
const credentials = require("./middlewares/credentials");
const corsOptions = require("./config/corsOptions");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const bodyParser = require("body-parser");
const errorMiddleware = require("./middlewares/error");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

app.use(credentials);
app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 1000,
  max: 2,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

app.use(
  session({
    secret:
      process.env.COOKIE_SECRET ||
      "348d1911e5741ff7d5a20bb384d1adb2c0fb255ecf4263ba25435f17d47e4e18",
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      expires: Date.now() + 1000 + 60 * 60 * 24 * 7,
      maxAge: 1000 + 60 * 60 * 24 * 7,
    },
  })
);

app.get("/", (req, res) => {
  res.status(200).json({
    status: true,
    message: "You probably shouldn't be here, but...",
    data: {
      service: "campus_pay-api",
      version: "1.0",
    },
  });
});



app.use(errorMiddleware);

module.exports = app;
