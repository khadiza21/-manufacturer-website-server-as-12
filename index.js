const express = require("express");
const cors = require("cors");
// const jwt = require("jsonwebtoken");
// const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;
const app = express();


//moddleware
app.use(cors());
app.use(express.json());


app.get("/", (req, res) => {
    res.send("manufacturer server is runnuning");
  });
  app.listen(port, () => {
    console.log("server is running on port", port);
  });