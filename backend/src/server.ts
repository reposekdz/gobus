import dotenv from 'dotenv';
import app from './app';
import logger from './utils/logger';
import { config } from './config';
import { db } from './config/database';

dotenv.config();

const PORT = config.port;

// Function to test MySQL connection
async function testDatabaseConnection() {
  try {
    const connection = await db.getConnection();
    logger.info('✅ MySQL database iriho kandi ikora neza (connected and ready)');
    console.log('✅ MySQL database iriho kandi ikora neza (connected and ready)');
    connection.release();
    return true;
  } catch (error: any) {
    logger.error('❌ MySQL database connection ikibazo (error):', error.message);
    console.error('❌ MySQL database connection ikibazo (error):', error.message);
    console.log('⚠️  Urakoresha SQLite nka backup (Using SQLite as backup)');
    return false;
  }
}

// Start server
async function startServer() {
  try {
    // Test database connection
    const dbConnected = await testDatabaseConnection();
    
    if (!dbConnected) {
      logger.warn('Gukomeza na SQLite (Continuing with SQLite fallback)');
      console.log('⚠️  Server iratangira na SQLite (Starting with SQLite)');
    }

    app.listen(PORT, () => {
      logger.info(`🚌 GoBus Backend Server irakora kuri port ${PORT}`);
      console.log(`🚌 GoBus Backend Server irakora kuri port ${PORT}`);
      console.log(`📝 Environment: ${config.nodeEnv}`);
      console.log(`🌐 Frontend URL: ${config.frontendUrl}`);
      console.log(`💾 Database: ${dbConnected ? 'MySQL (Production)' : 'SQLite (Fallback)'}`);
      console.log(`💰 MTN MoMo: ${config.features.enableMobileMoney ? 'Activated' : 'Disabled'}`);
      console.log(`🔒 Security: Advanced (${config.security.bcryptRounds} rounds)`);
      console.log(`✅ Health check: http://localhost:${PORT}/health`);
      console.log(`📖 API docs: http://localhost:${PORT}/api/v1`);
      console.log('');
      console.log('🎯 Advanced Features Activated:');
      console.log(`   - MTN Mobile Money: ${config.features.enableMobileMoney ? '✅' : '❌'}`);
      console.log(`   - Real-time Tracking: ${config.features.enableRealTimeTracking ? '✅' : '❌'}`);
      console.log(`   - Loyalty Program: ${config.features.enableLoyaltyProgram ? '✅' : '❌'}`);
      console.log(`   - QR Tickets: ${config.features.enableQrTickets ? '✅' : '❌'}`);
      console.log(`   - Offline Mode: ${config.features.enableOfflineMode ? '✅' : '❌'}`);
      console.log(`   - Multi-language: ${config.features.enableMultiLanguage ? '✅' : '❌'}`);
      console.log('');
      console.log('🚀 Byose byiteguye kandi bikora neza! (Everything is ready and functional!)');
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, hagarika server...');
      process.exit(0);
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, hagarika server...');
      process.exit(0);
    });

  } catch (error: any) {
    logger.error('❌ Ikibazo cyo gutangiza server (Server start error):', error);
    console.error('❌ Ikibazo cyo gutangiza server (Server start error):', error);
    process.exit(1);
  }
}

startServer();
