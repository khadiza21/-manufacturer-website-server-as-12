const express = require("express");
const cors = require("cors");
//const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;
const app = express();

//moddleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ptgfh8c.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const manufacturerCollection = client
      .db("manufacturer")
      .collection("tools");

    //get all data of tool items
    app.get("/tools", async (req, res) => {
      const query = {};
      const cursor = manufacturerCollection.find(query);
      const tool = await cursor.toArray();
      res.send(tool);
    });

    //find user for details
    app.get("/tools/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await manufacturerCollection.findOne(query);
      res.send(result);
    });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("manufacturer server is runnuning well");
});
app.listen(port, () => {
  console.log("server is running well on port", port);
});
