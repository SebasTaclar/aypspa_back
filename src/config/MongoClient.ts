import { MongoClient } from 'mongodb';
import { env_config } from './config';

const mongoUri = env_config.mongoDbUri;
export const mongoClient = new MongoClient(mongoUri);

export const connectMongoClient = async (): Promise<void> => {
  try {
    console.log('Connecting to MongoDB with URI:', mongoUri);
    await mongoClient.connect();
    console.log('MongoDB connected successfully!');
  } catch (error) {
    console.error('Failed to connect to MongoDB with URI:', mongoUri, 'Error:', error);
    throw error;
  }
};
