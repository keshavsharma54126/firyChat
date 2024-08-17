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
import { eq, and, or, asc } from "drizzle-orm";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] },
});

app.use(cors());
app.use(bodyParser.json());

const pool = new Pool({
  connectionString:
    "postgresql://sharmakeshav54126:GNjecx3dHJf4@ep-steep-fire-63657628-pooler.us-east-2.aws.neon.tech/chatApp?sslmode=require",
  ssl: true,
  connectionTimeoutMillis: 10000,
});

const db = drizzle(pool);
const userStatus: { [key: number]: string } = {};

const updateUserStatus = async (userId: number, status: any) => {
  try {
    userStatus[userId] = status;
    await db
      .update(users)
      .set({ status })
      .where(eq(users.id, userId))
      .execute();
    io.emit("statusUpdate", { userId, status });
  } catch (error) {
    console.error("Error updating user status:", error);
  }
};

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
    res.status(500).json({ error: "Database error, please try again later" });
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
  let userId: number | null = null;

  socket.on("userConnected", async (user: { id: number }) => {
    if (typeof user.id === "number") {
      userId = user.id;
      await updateUserStatus(userId, "online");
    } else {
      console.error("Invalid user ID:", user.id);
    }
  });

  socket.on("join", async (conversationId: number) => {
    socket.join(conversationId.toString());
    const conversationMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt))
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
      io.to(message.conversationId.toString()).emit(
        "messageStatus",
        "delivered"
      );

      io.to(message.conversationId.toString()).emit("messageStatus", {
        messageId: insertedMessage.id,
        status: "sent",
      });
      await db
        .update(messages)
        .set({ status: "delivered" })
        .where(eq(messages.id, insertedMessage.id))
        .execute();

      io.to;
    } catch (error) {
      console.error("Error saving message", error);
    }
  });
  socket.on("markAsRead", async ({ messageId, conversationId }) => {
    try {
      await db
        .update(messages)
        .set({ status: "read" })
        .where(eq(messages.id, messageId))
        .execute();
      io.to(conversationId.toString()).emit("messageStatus", {
        messageId,
        status: "read",
      });
    } catch (e) {
      console.error("error while markingmessage as read", e);
    }
  });

  socket.on("typing", async (data: { userId: number; recipientId: number }) => {
    await updateUserStatus(data.userId, "typing");
    socket.to(data.recipientId.toString()).emit("userTyping", data.userId);
  });

  socket.on(
    "stopTyping",
    async (data: { userId: number; recipientId: number }) => {
      await updateUserStatus(data.userId, "online");
      socket
        .to(data.recipientId.toString())
        .emit("userStopTyping", data.userId);
    }
  );

  socket.on("disconnect", async () => {
    console.log("User disconnected");
    if (userId) {
      await updateUserStatus(userId, "offline");
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
