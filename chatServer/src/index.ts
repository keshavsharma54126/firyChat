import express from "express";
import http from "http";
import { Server } from "socket.io";
import bodyParser from "body-parser";
import cors from "cors";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { users, messages, User, Message, NewUser, NewMessage } from "./schema";
import { and, eq, or } from "drizzle-orm";

// Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Update this to restrict access in production
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(bodyParser.json());

// PostgreSQL connection to Neon
const pool = new Pool({
  connectionString:
    "postgresql://sharmakeshav54126:GNjecx3dHJf4@ep-steep-fire-63657628-pooler.us-east-2.aws.neon.tech/chatApp?sslmode=require",
  ssl: true,
  connectionTimeoutMillis: 10000, // Increase connection timeout (10 seconds)
  idleTimeoutMillis: 30000, // Increase idle timeout (30 seconds)
  max: 20, // Increase max pool size if needed
});

pool.on("connect", () => {
  console.log("Connected to the database");
});

const db = drizzle(pool);

// Signup endpoint
app.post("/signup", async (req, res) => {
  const { username, email, googleId, imageUrl } = req.body;
  try {
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .execute();
    if (existingUser.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    const newUser: NewUser = {
      username,
      email,
      googleId,
      imageUrl,
      status: "offline",
      lastActive: new Date(),
      createdAt: new Date(),
    };

    const [insertedUser] = await db.insert(users).values(newUser).returning();
    res
      .status(201)
      .json({ message: "User created successfully", user: insertedUser });
  } catch (error) {
    console.error("Error while adding user to database", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Fetch all users
app.get("/users", async (req, res) => {
  try {
    const allUsers = await db.select().from(users).execute();
    res.status(200).json(allUsers);
  } catch (error) {
    console.error("Error fetching users", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Fetch messages between users
app.get("/messages", async (req, res) => {
  const recipientId = parseInt(req.query.recipientId as string, 10);
  const senderId = parseInt(req.query.senderId as string, 10);

  try {
    const allMessages = await db
      .select()
      .from(messages)
      .where(
        or(
          and(
            eq(messages.senderId, senderId),
            eq(messages.recipientId, recipientId)
          ),
          and(
            eq(messages.senderId, recipientId),
            eq(messages.recipientId, senderId)
          )
        )
      )
      .execute();
    res.status(200).json(allMessages);
  } catch (error) {
    console.error("Error fetching messages", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Socket.io events
io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on(
    "sendMessage",
    async (msg: { content: string; sender: string; recipientId: number }) => {
      try {
        // Fetch sender details
        const [senderUser] = await db
          .select()
          .from(users)
          .where(eq(users.username, msg.sender))
          .execute();

        if (senderUser) {
          const newMessage: NewMessage = {
            senderId: senderUser.id,
            recipientId: msg.recipientId,
            content: msg.content,
            status: "sent",
            createdAt: new Date(),
          };

          // Insert message into the database
          const [insertedMessage] = await db
            .insert(messages)
            .values(newMessage)
            .returning();

          // Emit the new message to the recipient
          io.emit("newMessage", insertedMessage);
        } else {
          console.error("Sender not found");
        }
      } catch (error) {
        console.error("Error while saving message to database", error);
      }
    }
  );

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
