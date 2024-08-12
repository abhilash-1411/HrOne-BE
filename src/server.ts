import express from 'express';
import authRoutes from './routes/authRoutes';

const app = express();
const port = 3000;

// Middleware
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
