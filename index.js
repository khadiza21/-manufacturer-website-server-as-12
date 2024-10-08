const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;
const app = express();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

//moddleware
app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    console.log("decoded", decoded);
    req.decoded = decoded;
    next();
  });
}

const uri = `mongodb+srv://bibikhadiza474:${process.env.MONGO_PASSWORD}@cluster0.g7cx4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const manufacturerCollection = client.db("manufacturer").collection("tools");
    const orderCollection = client.db("manufacturer").collection("orders");
    const reviewCollection = client.db("manufacturer").collection("reviews");
    const userCollection = client.db("manufacturer").collection("users");
    const paymentCollection = client.db("manufacturer").collection("payment");


    const verifyAdmin = async (req, res, next) => {
      const requester = req.decoded.email;
      const requesterAccount = await userCollection.findOne({
        email: requester,
      });
      if (requesterAccount.role === "admin") {
        next();
      } else {
        res.status(403).send({ message: "forbidden" });
      }
    };


        app.post('/create-payment-intent', verifyJWT, async(req, res) =>{
      const service = req.body;
      const price = service?.price;

      console.log("price",price);
      const amount = price*100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount : amount,
        currency: 'usd',
        payment_method_types:['card']
      });
      res.send({clientSecret: paymentIntent.client_secret})
    });

    // AUTH
    app.post("/login", async (req, res) => {
      const user = req.body;
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1d",
      });
      res.send({ accessToken });
    });

    //get all data of tool items
    app.get("/tools", async (req, res) => {
      const query = {};
     //  const cursor = manufacturerCollection.find(query);
      const cursor = manufacturerCollection.find().sort({$natural:-1});
      const tool = await cursor.toArray();
      res.send(tool);
    });

    app.get("/user", verifyJWT, async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
    });
    app.get("/user/:email", async (req, res) => {
     const email = req.params.email;
     const user= await userCollection.findOne({ email: email});
      res.send(user);
    });

    app.get("/admin/:email", async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });
      const isAdmin = user.role === "admin";
      res.send({ admin: isAdmin });
    });

    app.put("/user/admin/:email", verifyJWT, verifyAdmin, async (req, res) => {
      const email = req.params.email;

      const filter = { email: email };
      const updateDoc = {
        $set: { role: "admin" },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    });



        //update
  // user update api
  app.put('user/:email',verifyJWT, async (req, res) => {
    const email = req.params.email;
    const user = req.body;
    const filter = { email: email };
    const options = { upsert: true };
    const updateUser = {
      $set: {

        edu: user.edu,
        location: user.location,
        phone: user.phone,
        linkedin: user.linkedin,
      },
    };
    const result = await userCollection.updateOne(
      filter,
      updateUser,
      options
    );
    res.send(result);
  });

    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign(
        { email: email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "24h" }
      );
      res.send({ result, token });
    });

    //find user for details
    app.get("/tools/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await manufacturerCollection.findOne(query);
      res.send(result);
    });

    //POST
    app.post("/tools", verifyJWT, verifyAdmin, async (req, res) => {
      const newTools = req.body;
      const result = await manufacturerCollection.insertOne(newTools);
      res.send(result);
    });

    //delete
    app.delete("/tools/:id", verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await manufacturerCollection.deleteOne(query);
      res.send(result);
    });

    app.get("/orders/admin", async (req, res) => {
      const query = {};
      const cursor = orderCollection.find(query);
      const orders = await cursor.toArray();
      res.send(orders);
    });

    app.get('/orders/:id', verifyJWT, async(req, res) =>{
      const id = req.params.id;
      const query = {_id: ObjectId(id)};
      const orders = await orderCollection.findOne(query);
      res.send(orders);
    })

    // get users items
    app.get("/orders", verifyJWT, async (req, res) => {
      const decodedEmail = req.decoded.email;
      const email = req.query.email;
      console.log(email);
      if (email == decodedEmail) {
        const query = { email: email };
        const cursor = orderCollection.find(query);
        const myorders = await cursor.toArray();
        res.send(myorders);
      } else {
        res.status(403).send({ message: "forbidden access" });
      }
    });

    app.patch('/orders/:id', verifyJWT, async(req, res) =>{
      const id  = req.params.id;
      const payment = req.body;
      const filter = {_id: ObjectId(id)};
      const updatedDoc = {
        $set: {
          paid: true,
          transactionId: payment.transactionId
        }
      }

      const result = await paymentCollection.insertOne(payment);
      const updatedOrder = await orderCollection.updateOne(filter, updatedDoc);

      res.send(updatedOrder);
    })
    //POST
    app.post("/orders", async (req, res) => {
      const newOrder = req.body;
      const result = await orderCollection.insertOne(newOrder);
      res.send(result);
    });

    //delete
    app.delete("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await orderCollection.deleteOne(query);
      res.send(result);
    });

    app.get("/reviews", async (req, res) => {
      const query = {};
      //const cursor = reviewCollection.find(query);
      const cursor = reviewCollection.find().limit(6).sort({$natural:-1});
      const review = await cursor.toArray();
      res.send(review);
    });

    //POST
    app.post("/reviews", async (req, res) => {
      const newReview = req.body;
      const result = await reviewCollection.insertOne(newReview);
      res.send(result);
    });

    console.log("connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);



app.get("/", (req, res) => {
  res.send("manufacturer server is runnuning well");
});
app.listen(port, () => {
  console.log("server is running well on port", port);
});
