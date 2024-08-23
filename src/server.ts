import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes";

const app = express();
const port = 3000;

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());

// Routes
app.use("/", authRoutes);

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
