// server/index.ts
import { app } from "./app";
import { Hono } from "hono";
import { cors } from "hono/cors";

const honoApp = new Hono();

// allow only your frontend origin and credentials
honoApp.use("*", cors({
  origin: "http://localhost:5173", // change to your frontend origin
  credentials: true,
  // optionally: allowHeaders: ["Content-Type", "Authorization"], allowMethods: ["GET","POST","PUT","PATCH","OPTIONS"]
}));


export default app// ...mount routes / start server ...