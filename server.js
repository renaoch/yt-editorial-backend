require("dotenv").config();
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const path = require("path");
const connectDB = require("./config/connectDB");
const morgan = require("morgan");
const cors = require("cors");
const pgSession = require("connect-pg-simple")(session);

const app = express();

const { Pool } = require('pg');

const yourPostgresPool = new Pool({
  user: 'postgres',
  host: 'db.hcdbzbgpqonluaqmwvdo.supabase.co',
  database: 'postgres',
  password: 'dD2Lp8ymDiAx%2B2',
  port: 5432,
});

// app.use(morgan("dev"));

// Passport Config
require("./config/passportConfig");

// Middleware
app.use(express.json());

// CORS options
const corsOptions = {
  origin: ["https://yt-editorial-backend.onrender.com", "http://localhost:5173","https://yt-editorial-frontend.onrender.com","https://yt-editorial-client-b0w17ezeq-chhetriprems-projects.vercel.app","https://yt-editorial-frontend-3ym07qqca-renaochs-projects.vercel.app","https://yt-editorial-frontend.vercel.app"], // Use dynamic frontend URL from environment variables
  methods: "GET,POST,PUT,DELETE,PATCH",
  credentials: true, 
};

app.use(cors(corsOptions));
// Session middleware
app.use(
  session({
    store: new pgSession({
      pool: yourPostgresPool,  // Ensure that the pool is connected
      tableName: 'session',    // Table to store sessions (must be created in DB)
    }),
    secret: process.env.SESSION_SECRET_KEY, // Use dynamic secret key from environment variables
    resave: false,
    saveUninitialized: false,
    cookie: {
  

      secure: true,          // MUST be true when using HTTPS (Render is HTTPS)
      sameSite: 'None',      // MUST be 'none' to allow cross-origin
      httpOnly: true,        // Recommended to prevent XSS
      maxAge: 24 * 60 * 60 * 1000 // Optional: 1 day
    }
  })
);

app.use(express.static(path.join(__dirname, "public")));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Routes
const authRoute = require("./routes/authRoute");
const userRoute = require("./routes/userRoute");
const videoRoute = require("./routes/videoRoute");
const messageRoute = require("./routes/messageRoute");
const notificationRoutes = require("./routes/notificationRoutes");

app.use("/", authRoute);
app.use("/user", userRoute);
app.use("/upload", videoRoute);
app.use("/message", messageRoute);
app.use("/notify", notificationRoutes);

// Server
const PORT = process.env.PORT || 8080; // Use dynamic port from environment variables
app.listen(PORT, () => {
  connectDB(); // Ensure to connect to the database
  console.log(`Server running at ${process.env.BASE_URL}:${PORT}`);
});
