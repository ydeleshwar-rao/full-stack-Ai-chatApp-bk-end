import dotenv from "dotenv";
import express from "express";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import messageRoutes from "./routes/message.routes.js";
import cors from "cors";
import { app, server } from "./lib/socket.js";

import path from "path";
dotenv.config();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: [
    "http://localhost:5173",                // local dev
    "https://ydeleshwar-rao.github.io/full-stack-Ai-chatApp-fn"      // GitHub Pages
  ],
  credentials: true,
}));
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
                                       
const PORT =  process.env.PORT || 4000;   //process.env.PORT ||
server.listen(PORT, () => {
    console.log(`server running on port ${PORT}`);
});