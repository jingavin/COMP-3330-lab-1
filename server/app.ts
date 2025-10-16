// server/app.ts
import { Hono } from "hono";
import { authRoute } from './auth/kinde'
import { logger } from "hono/logger";
import { expensesRoute } from "./routes/expenses";
import { cors } from "hono/cors";
import { secureRoute } from './routes/secure'
import { uploadRoute } from './routes/upload'


export const app = new Hono();

// Global middleware
app.use("*", logger());

app.use(
  "/api/*",
  cors({
    origin: "http://localhost:5173",
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

// Custom timing middleware
app.use("*", async (c, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  // Add a response header so we can see timings in curl or other clients
  c.header("X-Response-Time", `${ms}ms`);
});

// Routes
app.get("/", (c) => c.json({ message: "OK" }));
app.get("/health", (c) => c.json({ status: "healthy" }));
app.get("/api/test", (c) => c.json({ message: "test" }));

app.route('/api/auth', authRoute)
app.route('/api/secure', secureRoute)
app.route("/api/expenses", expensesRoute);
app.route('/api/upload', uploadRoute)
