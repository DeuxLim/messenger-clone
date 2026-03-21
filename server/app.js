import express from "express";
import cors from "cors";
import connectDB from "./config/database.js";
import registerRoutes from "./routes/index.js";
import cookieParser from "cookie-parser";

/* Start Database */
connectDB();

const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

/* Middlewares */
app.use(
	cors({
		origin: process.env.CLIENT_URL,
		credentials: true,
	}),
);

app.use(express.json());

// For forms
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* Routes */
registerRoutes(app);

export default app;
