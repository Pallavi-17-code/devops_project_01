// ─── Environment & Dependencies ─────────────────────────────────────────────
require('dotenv').config();
const express = require('express');
const cors = require('cors');

// ─── Internal Imports ────────────────────────────────────────────────────────
const { connectDB } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const healthRoutes = require('./routes/healthRoutes');
const pipelineRoutes = require('./routes/pipelineRoutes');
const dockerRoutes = require('./routes/dockerRoutes');
const jenkinsRoutes = require('./routes/jenkinsRoutes');
const { protect } = require('./middleware/authMiddleware');
const errorHandler = require('./middleware/errorHandler');
const log = require('./utils/logger');

// ─── Initialize Express ──────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 5001;

// ─── Middlewares ─────────────────────────────────────────────────────────────
app.use(cors());                      // Enable Cross-Origin Resource Sharing
app.use(express.json());              // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// ─── Logging Middleware (Elite) ──────────────────────────────────────────────
app.use((req, res, next) => {
  log.request(req.method, req.url);
  next();
});

// ─── Public Routes ───────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'CI/CD Dashboard API is Running',
    version: '1.0.0'
  });
});

app.use('/api/health', healthRoutes); // Health check endpoints
app.use('/api/auth', authRoutes);     // Auth (register/login) endpoints
app.use('/api/pipelines', pipelineRoutes); // Pipeline management (protected)
app.use('/api/docker', dockerRoutes);       // Docker monitoring (protected)
app.use('/api/jenkins', jenkinsRoutes);     // Jenkins integration (protected)

// ─── Protected Routes ────────────────────────────────────────────────────────
// This route requires a valid JWT token in the Authorization header
app.get('/api/protected', protect, (req, res) => {
  res.json({
    success: true,
    message: 'Access Granted: You are viewing a protected route',
    user: req.user // Decoded from JWT in authMiddleware
  });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Server Startup ──────────────────────────────────────────────────────────
const startServer = async () => {
  try {
    // Attempt DB Connection
    await connectDB();
    
    // Listen for requests
    app.listen(PORT, () => {
      log.server(PORT);
    });
  } catch (error) {
    log.error(`Server startup failed: ${error.message}`);
    process.exit(1);
  }
};

startServer();
