import * as dotenv from 'dotenv';
dotenv.config();

export const isDebug = process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true';

export const env_config = {
  databaseType: process.env.DATABASE_TYPE || 'prisma', // 'mongodb' or 'prisma'
  mongoDbUri: process.env.MONGO_DB_URI || '',
  mongoDbDatabase: process.env.MONGO_DB_DATABASE || '',
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiration: parseInt(process.env.JWT_EXPIRATION || '3600', 10),
  debug: process.env.DEBUG === 'true',
  nodeEnv: process.env.NODE_ENV || 'production',
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  awsRegion: process.env.AWS_REGION || '',
  awsBucketName: process.env.AWS_BUCKET_NAME || '',
};
