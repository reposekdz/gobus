import dotenv from 'dotenv';

dotenv.config();

const config = {
  port: process.env.PORT || 8000,
  nodeEnv: process.env.NODE_ENV || 'production',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5000',
  
  mysql: {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'gobus_user',
    password: process.env.MYSQL_PASSWORD || 'GoBus2024!SecureDB#Rwanda',
    database: process.env.MYSQL_DATABASE || 'gobus_production',
    connectionLimit: parseInt(process.env.MYSQL_CONNECTION_LIMIT || '50'),
    timeout: parseInt(process.env.MYSQL_TIMEOUT || '60000'),
    acquireTimeout: parseInt(process.env.MYSQL_ACQUIRE_TIMEOUT || '60000'),
    reconnect: process.env.MYSQL_RECONNECT === 'true'
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    maxRetries: parseInt(process.env.REDIS_MAX_RETRIES || '3')
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'GoBus2024!SuperSecretJWTKey#Rwanda$Production%Advanced&Features',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'GoBus2024!RefreshSecret#Rwanda$Production%JWT&Refresh',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    adminSecret: process.env.JWT_ADMIN_SECRET || 'GoBus2024!AdminJWT#SuperSecure$Rwanda%Production',
    companySecret: process.env.JWT_COMPANY_SECRET || 'GoBus2024!CompanyJWT#Secure$Rwanda%Production',
    driverSecret: process.env.JWT_DRIVER_SECRET || 'GoBus2024!DriverJWT#Secure$Rwanda%Production'
  },
  
  session: {
    secret: process.env.SESSION_SECRET || 'GoBus2024!SessionSecret#Rwanda$Production%Advanced&Secure',
    maxAge: parseInt(process.env.SESSION_MAX_AGE || '86400000'),
    secure: process.env.SESSION_SECURE === 'true',
    httpOnly: process.env.SESSION_HTTP_ONLY === 'true'
  },
  
  mtn: {
    apiBaseUrl: process.env.MTN_API_BASE_URL || 'https://sandbox.momodeveloper.mtn.com',
    collection: {
      primaryKey: process.env.MTN_COLLECTION_PRIMARY_KEY,
      secondaryKey: process.env.MTN_COLLECTION_SECONDARY_KEY,
      userId: process.env.MTN_COLLECTION_USER_ID,
      apiKey: process.env.MTN_COLLECTION_API_KEY
    },
    disbursement: {
      primaryKey: process.env.MTN_DISBURSEMENT_PRIMARY_KEY,
      secondaryKey: process.env.MTN_DISBURSEMENT_SECONDARY_KEY,
      userId: process.env.MTN_DISBURSEMENT_USER_ID,
      apiKey: process.env.MTN_DISBURSEMENT_API_KEY
    },
    callbackUrl: process.env.MTN_CALLBACK_URL || 'https://api.gobus.rw/webhooks/mtn',
    environment: process.env.MTN_ENVIRONMENT || 'sandbox'
  },
  
  airtel: {
    apiBaseUrl: process.env.AIRTEL_API_BASE_URL || 'https://openapiuat.airtel.africa',
    clientId: process.env.AIRTEL_CLIENT_ID,
    clientSecret: process.env.AIRTEL_CLIENT_SECRET,
    grantType: process.env.AIRTEL_GRANT_TYPE || 'client_credentials',
    country: process.env.AIRTEL_COUNTRY || 'RW',
    currency: process.env.AIRTEL_CURRENCY || 'RWF',
    callbackUrl: process.env.AIRTEL_CALLBACK_URL || 'https://api.gobus.rw/webhooks/airtel',
    environment: process.env.AIRTEL_ENVIRONMENT || 'staging'
  },
  
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    connectClientId: process.env.STRIPE_CONNECT_CLIENT_ID
  },
  
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM || 'GoBus Rwanda <noreply@gobus.rw>',
    admin: process.env.EMAIL_ADMIN || 'admin@gobus.rw',
    support: process.env.EMAIL_SUPPORT || 'support@gobus.rw'
  },
  
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
    verifyServiceSid: process.env.TWILIO_VERIFY_SERVICE_SID
  },
  
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    databaseUrl: process.env.FIREBASE_DATABASE_URL,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
  },
  
  google: {
    mapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
    placesApiKey: process.env.GOOGLE_PLACES_API_KEY,
    directionsApiKey: process.env.GOOGLE_DIRECTIONS_API_KEY,
    geocodingApiKey: process.env.GOOGLE_GEOCODING_API_KEY
  },
  
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET
  },
  
  aws: {
    s3Bucket: process.env.AWS_S3_BUCKET,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  },
  
  security: {
    passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8'),
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '14'),
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
    lockoutDurationMinutes: parseInt(process.env.LOCKOUT_DURATION_MINUTES || '30'),
    passwordRequireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE === 'true',
    passwordRequireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE === 'true',
    passwordRequireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS === 'true',
    passwordRequireSymbols: process.env.PASSWORD_REQUIRE_SYMBOLS === 'true',
    otpExpiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '10'),
    otpLength: parseInt(process.env.OTP_LENGTH || '6')
  },
  
  business: {
    bookingExpiryMinutes: parseInt(process.env.BOOKING_EXPIRY_MINUTES || '15'),
    maxSeatsPerBooking: parseInt(process.env.MAX_SEATS_PER_BOOKING || '8'),
    refundWindowHours: parseInt(process.env.REFUND_WINDOW_HOURS || '24'),
    loyaltyPointsRatio: parseFloat(process.env.LOYALTY_POINTS_RATIO || '0.02'),
    maxLoyaltyDiscount: parseFloat(process.env.MAX_LOYALTY_DISCOUNT || '0.25'),
    cancellationFeePercentage: parseFloat(process.env.CANCELLATION_FEE_PERCENTAGE || '0.1'),
    earlyBirdDiscountPercentage: parseFloat(process.env.EARLY_BIRD_DISCOUNT_PERCENTAGE || '0.15'),
    groupBookingDiscountPercentage: parseFloat(process.env.GROUP_BOOKING_DISCOUNT_PERCENTAGE || '0.1'),
    corporateDiscountPercentage: parseFloat(process.env.CORPORATE_DISCOUNT_PERCENTAGE || '0.2')
  },
  
  features: {
    enableAiRecommendations: process.env.ENABLE_AI_RECOMMENDATIONS === 'true',
    enableRealTimeTracking: process.env.ENABLE_REAL_TIME_TRACKING === 'true',
    enableDynamicPricing: process.env.ENABLE_DYNAMIC_PRICING === 'true',
    enableLoyaltyProgram: process.env.ENABLE_LOYALTY_PROGRAM === 'true',
    enableMultiLanguage: process.env.ENABLE_MULTI_LANGUAGE === 'true',
    enablePushNotifications: process.env.ENABLE_PUSH_NOTIFICATIONS === 'true',
    enableEmailNotifications: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true',
    enableSmsNotifications: process.env.ENABLE_SMS_NOTIFICATIONS === 'true',
    enableBlockchainWallet: process.env.ENABLE_BLOCKCHAIN_WALLET === 'true',
    enableMobileMoney: process.env.ENABLE_MOBILE_MONEY === 'true',
    enableQrTickets: process.env.ENABLE_QR_TICKETS === 'true',
    enableOfflineMode: process.env.ENABLE_OFFLINE_MODE === 'true',
    enableBiometricAuth: process.env.ENABLE_BIOMETRIC_AUTH === 'true'
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000'),
    authWindowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || '900000'),
    authMaxRequests: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || '10'),
    paymentWindowMs: parseInt(process.env.PAYMENT_RATE_LIMIT_WINDOW_MS || '300000'),
    paymentMaxRequests: parseInt(process.env.PAYMENT_RATE_LIMIT_MAX_REQUESTS || '5')
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/gobus-production.log',
    errorFile: process.env.LOG_ERROR_FILE || 'logs/gobus-errors.log',
    accessFile: process.env.LOG_ACCESS_FILE || 'logs/gobus-access.log'
  },
  
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '3600'),
    sessionCacheTtl: parseInt(process.env.SESSION_CACHE_TTL || '86400'),
    apiCacheTtl: parseInt(process.env.API_CACHE_TTL || '300'),
    staticCacheTtl: parseInt(process.env.STATIC_CACHE_TTL || '31536000')
  },
  
  ai: {
    openaiApiKey: process.env.OPENAI_API_KEY,
    geminiApiKey: process.env.GEMINI_API_KEY
  }
};

export default config;
export { config };
