const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

app.use(cors());
app.use(express.json());

// samratahammed29
// QJgjL27381fOLUBJ

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4skfwvm.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
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
    // await client.connect();

    const postsCollection = client.db("postDB").collection("posts");
    const usersCollection = client.db("postDB").collection("users");
    const commentCollection = client.db("postDB").collection("comments");

    // post related....
    app.get("/posts", async (req, res) => {
      const result = await postsCollection.find().toArray();
      res.send(result);
    });

    // app.get("/singlePost", async (req, res) => {
    //   let query = {};
    //   if (req.query?.email) {
    //     query = { email: req.query.email };
    //   }
    //   console.log(query);
    //   const result = await postsCollection.findOne(query);
    //   res.send(result);
    // });

    app.get("/singlePost", async (req, res) => {
      const { email } = req.query;
      const cursor = postsCollection.find({ email: email });
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/posts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await postsCollection.findOne(query);
      res.send(result);
    });

    app.post("/posts", async (req, res) => {
      const query = req.body;
      const result = await postsCollection.insertOne(query);
      res.send(result);
    });

    app.delete("/singlePosts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await postsCollection.deleteOne(query);
      res.send(result);
    });

    app.put("/UpVote/:id", async (req, res) => {
      const id = req.params.id;
      const updatedPost = await postsCollection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $inc: { upVote: 1 } }
        // { returnDocument: "after" }
      );

      res.send(updatedPost.value);
    });

    app.put("/downVote/:id", async (req, res) => {
      const id = req.params.id;
      const updatedPost = await postsCollection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $inc: { downVote: 1 } }
        // { returnDocument: "after" }
      );

      res.send(updatedPost.value);
    });

    // users related .........................

    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await usersCollection.findOne(query);

      if (existingUser) {
        return res.send({ message: "user already exist", insertedId: null });
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // Admin related............

    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("dev in going");
});

app.listen(port, (req, res) => {
  console.log(`dev is setting on port${port}`);
});
