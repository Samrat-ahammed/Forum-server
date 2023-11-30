const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KYE);
const port = process.env.PORT || 5000;

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
    const paymentCollection = client.db("postDB").collection("payment");
    const announcementCollection = client
      .db("postDB")
      .collection("announcement");

    // jwt...........

    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SEC, {
        expiresIn: "1hr",
      });
      res.send({ token });
    });

    const verifyToken = (req, res, next) => {
      // console.log("inside verify token", req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "unAuthorized access" });
      }
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SEC, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "unAuthorized access" });
        }
        req.decoded = decoded;
        next();
      });
      // next();
    };

    const adminVerify = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      const isAdmin = user?.role === "admin";
      if (!isAdmin) {
        return res.status(401).send({ message: "forbidden" });
      }

      next();
    };

    // post related....
    app.get("/posts", async (req, res) => {
      const result = await postsCollection.find().toArray();
      res.send(result);
    });

    // app.get("/singlePost/:email", async (req, res) => {
    //   const email = req.params.email;
    //   const query = { email: email };
    //   const result = await postsCollection.findOne(query);
    //   res.send(result);
    // });

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
      console.log(id);
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

    app.get("/singleUser/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await usersCollection.findOne(query);
      res.send(result);
    });

    app.get("/users/admin/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "forbidden" });
      }
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === "admin";
      }
      res.send({ admin });
    });

    app.put("/user-badge/:email", async (req, res) => {
      const email = req.params.email;
      console.log("my email", email);
      const filter = { email: email };
      const updateProduct = req.body;
      const updateDoc = {
        $set: {
          badge: updateProduct.badge,
        },
      };

      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // app.get("/users/admin/:email", async (req, res) => {
    //   try {
    //     const email = req.params.email;

    //     if (email !== req.decoded.email) {
    //       return res.status(403).send({ message: "forbidden" });
    //     }

    //     const query = { email: email };

    //     const user = await usersCollection.findOne(query);

    //     if (user) {
    //       const admin = user?.role === "admin";
    //       res.send({ admin });
    //     } else {
    //       res.status(404).send({ error: "User not found" });
    //     }
    //   } catch (error) {
    //     console.error("Error checking admin status:", error);
    //     res.status(500).send({ error: "Internal server error" });
    //   }
    // });

    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === "admin";
      }
      res.send({ admin });
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

    // comment ..............

    app.get("/comment", async (req, res) => {
      const query = req.body;
      const result = await commentCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/comment", async (req, res) => {
      const query = req.body;
      const result = await commentCollection.insertOne(query);
      res.send(result);
    });

    // app.get("/postsComment/:id", async (req, res) => {
    //   const postId = req.params.id;
    //   console.log("Requested Post ID:", postId);
    //   const comments = await commentCollection.find({ postId }).toArray();
    //   res.send(comments);
    // });

    app.get("/post-comments/:postId", async (req, res) => {
      const postId = req.params.postId;

      console.log("Requested Post ID:", postId);
      if (!postId) return;
      try {
        const comments = await commentCollection.find({ postId }).toArray();

        res.send(comments);
      } catch (error) {
        console.error("Error retrieving comments:", error);
        res.status(500).send({ error: "Internal Server Error" });
      }
    });

    // announcement related ..............

    app.post("/announcement", async (req, res) => {
      const query = req.body;
      const result = await announcementCollection.insertOne(query);
      res.send(result);
    });

    app.get("/announcements", async (req, res) => {
      const result = await announcementCollection.find().toArray();
      res.send(result);
    });

    // payment related .......

    // app.get("/payments/:email", async (req, res) => {
    //   const email = req.params.email;
    //   const query = {
    //     email: email,
    //   };

    //   if (req.params?.email !== req.decoded?.email) {
    //     return res.status(403).send({ message: "forbidden access" });
    //   }
    //   const result = await paymentsCollection.find(query).toArray();
    //   res.send(result);
    // });

    // app.post("/create-payment-intent", async (req, res) => {
    //   const price = 50;

    //   const paymentIntent = await stripe.paymentIntents.create({
    //     amount: price,
    //     currency: "usd",
    //     payment_method_types: ["card"],
    //   });

    //   console.log(paymentIntent.client_secret);

    //   res.send({
    //     clientSecret: paymentIntent.client_secret,
    //   });
    // });

    // app.post("/payments", async (req, res) => {
    //   const payment = req.body;
    //   const paymentResult = await paymentsCollection.insertOne(payment);
    //   console.log("payments cart......", payment);

    //   const query = {
    //     _id: {
    //       $in: payment.cartIds.map((id) => new ObjectId(id)),
    //     },
    //   };

    //   res.send({ paymentResult });
    // });

    // payment intent
    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);
      // console.log(amount, "amount inside the intent");

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    app.get("/payments/:email", verifyToken, async (req, res) => {
      const query = { email: req.params.email };
      if (req.params.email !== req.decoded.email) {
        return res.status(403).send({ message: "forbidden access" });
      }
      const result = await paymentCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/payments", async (req, res) => {
      const payment = req.body;
      const paymentResult = await paymentCollection.insertOne(payment);
      // console.log("payment info", payment);
      res.send(paymentResult);
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
