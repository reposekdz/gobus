import dotenv from 'dotenv';
import app from './app';
import logger from './utils/logger';

dotenv.config();

const PORT = process.env.PORT || 8000;

// Start server without database connection (demo mode)
// For production with MySQL, uncomment the connectDB code below
app.listen(PORT, () => {
  logger.info(`🚌 GoBus Backend Server running on port ${PORT}`);
  console.log(`🚌 GoBus Backend Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log(`💾 Database: Demo mode (MySQL connection disabled for Replit)`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
  console.log(`📖 API docs: http://localhost:${PORT}/api/v1`);
});