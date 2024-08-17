import express from "express";
import http from "http";
import { Server } from "socket.io";
import bodyParser from "body-parser";
import cors from "cors";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import {
  users,
  messages,
  conversation,
  User,
  Message,
  NewUser,
  NewMessage,
  NewConversation,
} from "./schema";
import { eq, and, or } from "drizzle-orm";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.use(cors());
app.use(bodyParser.json());

const pool = new Pool({
  connectionString:
    "postgresql://sharmakeshav54126:GNjecx3dHJf4@ep-steep-fire-63657628-pooler.us-east-2.aws.neon.tech/chatApp?sslmode=require",
  ssl: true,
  // Increase max pool size if needed
});

const db = drizzle(pool);

app.post("/signup", async (req, res) => {
  const { username, email, googleId, imageUrl } = req.body;
  try {
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .execute();
    if (existingUser.length > 0) {
      return res.status(200).json({ user: existingUser[0] });
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

app.get("/users", async (req, res) => {
  try {
    const allUsers = await db.select().from(users).execute();
    res.status(200).json(allUsers);
  } catch (error) {
    console.error("Error fetching users", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/conversations", async (req, res) => {
  const { user1Id, user2Id } = req.body;
  try {
    const existingConversation = await db
      .select()
      .from(conversation)
      .where(
        or(
          and(
            eq(conversation.user1Id, user1Id),
            eq(conversation.user2Id, user2Id)
          ),
          and(
            eq(conversation.user1Id, user2Id),
            eq(conversation.user2Id, user1Id)
          )
        )
      )
      .execute();

    if (existingConversation.length > 0) {
      return res.status(200).json({ conversation: existingConversation[0] });
    }

    const newConversation: NewConversation = { user1Id, user2Id };
    const [insertedConversation] = await db
      .insert(conversation)
      .values(newConversation)
      .returning();
    res.status(201).json({ conversation: insertedConversation });
  } catch (error) {
    console.error("Error creating conversation", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("join", async (conversationId: number) => {
    socket.join(conversationId.toString());
    const conversationMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .execute();
    socket.emit("loadMessages", conversationMessages);
  });

  socket.on("sendMessage", async (message: NewMessage) => {
    try {
      const [insertedMessage] = await db
        .insert(messages)
        .values(message)
        .returning();
      io.to(message.conversationId.toString()).emit(
        "newMessage",
        insertedMessage
      );
    } catch (error) {
      console.error("Error saving message", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
