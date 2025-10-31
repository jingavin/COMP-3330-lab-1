// server/app.ts
import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { serveStatic } from "@hono/node-server/serve-static";

import { authRoute } from "./auth/kinde";
import { expensesRoute } from "./routes/expenses";
import { secureRoute } from "./routes/secure";
import { uploadRoute } from "./routes/upload";

export const app = new Hono();

// 1) global middleware
app.use("*", logger());

// 2) CORS only for API
app.use(
  "/api/*",
  cors({
    origin: "http://localhost:5173",
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

// 3) timing header (optional)
app.use("*", async (c, next) => {
  const start = Date.now();
  await next();
  c.header("X-Response-Time", `${Date.now() - start}ms`);
});

// 4) health + API routes
app.get("/health", (c) => c.text("ok"));
app.get("/api/test", (c) => c.json({ message: "test" }));

app.route("/api/auth", authRoute);
app.route("/api/secure", secureRoute);
app.route("/api/expenses", expensesRoute);
app.route("/api/upload", uploadRoute);


// 5) serve static React build
app.use("/*", serveStatic({ root: "./server/public" }));

// 6) SPA fallback for React Router
app.get("*", async (c, next) => {
  const url = new URL(c.req.url);
  if (url.pathname.startsWith("/api")) return next();

  return c.html(await Bun.file("./server/public/index.html").text());
});

