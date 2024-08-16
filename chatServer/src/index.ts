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

const sql = neon(process.env.DRIZZLE_DATABASE_URL!);
const db = drizzle(sql);
app.listen(process.env.PORT, () => {
  console.log("server is on baby");
});
