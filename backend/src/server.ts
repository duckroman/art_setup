import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import artworkRoutes from './routes/artworks';
import scenarioRoutes from './routes/scenarios';
import generatorRoutes from './routes/generator'; // Import generator routes

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// DB Connection
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/artsetup';
mongoose.connect(mongoUri)
  .then(() => console.log('MongoDB database connection established successfully'))
  .catch(err => console.log(err));

// API Routes
app.use('/api/artworks', artworkRoutes);
app.use('/api/scenarios', scenarioRoutes);
app.use('/api/generate-scenario', generatorRoutes); // Use generator routes

// Server
app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});

