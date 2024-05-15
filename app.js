require('dotenv').config();

const cookieParser = require("cookie-parser");
const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const UserModel = require("./models/user");


const app = express();
const port = process.env.PORT;


// Set the view engine to EJS
app.set("view engine", "ejs");

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());

// Routes

// Home route
app.get("/", (req, res) => {
  res.render("index");
});

// Create user route
app.post("/create", (req, res) => {
  const { username, email, password, age } = req.body;

  bcrypt.genSalt(10, (err, salt) => {
    if (err) {
      return res.status(500).send({ error: "Error generating salt" });
    }

    bcrypt.hash(password, salt, async (err, hash) => {
      if (err) {
        return res.status(500).send({ error: "Error hashing password" });
      }

      try {
        const createdUser = await UserModel.create({
          username,
          email,
          password: hash,
          age,
        });

        const token = jwt.sign({ email }, "shhhhh");
        res.cookie("token", token);

        res.status(201).send(createdUser);
      } catch (error) {
        res.status(500).send({ error: "Error creating user" });
      }
    });
  });
});

// Login routes
app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  try {
    const user = await UserModel.findOne({ email: req.body.email });

    if (!user) {
      return res.status(400).send("Something went wrong");
    }

    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (validPassword) {
      res.send(`Hello ${user.username}, welcome back`);
    } else {
      res.status(400).send("Something went wrong");
    }
  } catch (error) {
    res.status(500).send({ error: "Error during login" });
  }
});

// Logout route
app.get("/logout", (req, res) => {
  res.cookie("token", "");
  res.redirect("/");
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
