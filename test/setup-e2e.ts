// Setup file for E2E tests - loads environment variables
process.env.FRONTEND_URL = 'http://localhost:5173';

// Database
process.env.DB_TYPE = 'postgres';
process.env.DB_PORT = '5432';
process.env.DB_HOST = 'localhost';
process.env.DB_NAME = 'p2ventas';
process.env.DB_USERNAME = 'postgres';
process.env.DB_PASSWORD = '1234';

// JWT
process.env.JWT_ACCESS_SECRET = 'test-access-secret-key-for-e2e-tests';
process.env.JWT_ACCESS_EXPIRATION = '15m';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-e2e-tests';
process.env.JWT_REFRESH_EXPIRATION = '1d';

// Seed Owner
process.env.SEED_OWNER_EMAIL = 'owner@admin.com';
process.env.SEED_OWNER_PASSWORD = 'Utnfrvm123!';
process.env.SEED_OWNER_FIRST_NAME = 'Admin';
process.env.SEED_OWNER_LAST_NAME = 'Admin';
process.env.SEED_OWNER_PHONE = '1234567890';
process.env.SEED_OWNER_ADDRESS = 'Dirección Admin 123';

// Mail (not critical for E2E tests)
process.env.MAIL_HOST = 'smtp.test.com';
process.env.MAIL_PORT = '587';
process.env.MAIL_USER = 'test';
process.env.MAIL_PASS = 'test';
process.env.MAIL_FROM = 'test@test.com';
process.env.MAIL_SECURE = 'false';

// AWS S3 (not critical for E2E tests)
process.env.AWS_ACCESS_KEY_ID = 'test-key';
process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';
process.env.AWS_S3_BUCKET_NAME = 'test-bucket';
process.env.AWS_REGION = 'us-east-1';
