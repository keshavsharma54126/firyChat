import express, { Request, Response } from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import { ClerkExpressWithAuth } from "@clerk/clerk-sdk-node";
import { Pool } from "pg";
// Ensure you are using the correct import from drizzle-orm based on its documentation
import { pgTable } from "drizzle-orm/pg-core";
import { users } from "./schema"; // Import your schema
import { drizzle } from "drizzle-orm/neon-http";

const app = express();
app.use(express.json());

// PostgreSQL pool setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Initialize the Drizzle ORM with the PostgreSQL pool
const db = drizzle(pool); // Ensure drizzle is the correct import

// Clerk setup

// User signup route
app.post("/signup", async (req: Request, res: Response) => {
  const { email, password, username } = req.body;

  try {
    // Create a new user in Clerk
    const clerkUser = await db.insert(users).values({
      email,
      password,
      username,
    });

    // Save user in your database
    await db.insert(users).values({
      username,
      email,
      password, // Note: Store hashed password in a real app
    });

    res.status(201).json({ id: clerkUser.id, email, username });
  } catch (error) {
    console.error("Error signing up user:", error);
    res.status(500).json({ error: "Failed to sign up user" });
  }
});

// Create HTTP server and Socket.io server
const server = http.createServer(app);
const io = new Server(server);

// Handle Socket.io connections
io.on("connection", (socket: Socket) => {
  console.log("New Socket.io connection");

  socket.on("message", (message: string) => {
    console.log("Received message:", message);
    // Handle Socket.io messages here
  });

  socket.on("disconnect", () => {
    console.log("Socket.io connection closed");
  });
});

// Start server
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
