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
    const orderCollection = client.db("manufacturer").collection("orders");
    const reviewCollection = client.db("").collection("reviews");
    const userCollection = client.db('manufacturer').collection('users');

    //get all data of tool items
    app.get("/tools", async (req, res) => {
      const query = {};
      const cursor = manufacturerCollection.find(query);
      const tool = await cursor.toArray();
      res.send(tool);
    });


    app.put('/user/:email', async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      //const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
      res.send({ result, token });
    });

    //find user for details
    app.get("/tools/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await manufacturerCollection.findOne(query);
      res.send(result);
    });



    app.get("/orders", async (req, res) => {
      const query = {};   
      const cursor = orderCollection.find(query); 
      const orders = await cursor.toArray();
      res.send(orders);
    });

    //POST
    app.post("/orders", async (req, res) => {
      const newOrder = req.body;
      const result = await orderCollection.insertOne(newOrder);
      res.send(result);
    });

    app.get("/reviews", async (req, res) => {
      const query = {};
      const cursor = reviewCollection.find(query);
      const review = await cursor.toArray();
      res.send(review);
    });

     //POST
     app.post("/reviews", async (req, res) => {
      const newReview = req.body;
      const result = await reviewCollection.insertOne(newReview);
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
