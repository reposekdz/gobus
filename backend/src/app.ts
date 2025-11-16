import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors({
  origin: process.env.ENABLE_CORS_ALL === 'true' ? '*' : process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'GoBus Backend Server',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    productionConfigAvailable: true
  });
});

// Try to load full routes, fall back to simple routes
let apiRoutes;
try {
  apiRoutes = require('./routes/index').default;
  console.log('✅ Full API routes loaded');
} catch (error) {
  console.log('⚠️  Loading simple demo routes (database not configured)');
  apiRoutes = require('./routes/index.simple').default;
}

// API routes (versioned)
app.use('/api/v1', apiRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'GoBus Backend API',
    version: '1.0.0',
    apiDocs: '/api/v1',
    health: '/health'
  });
});

// Error handling
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

export default app;
