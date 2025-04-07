import { MongoClient } from 'mongodb';

export abstract class MongoDbAdapter {
  protected client: MongoClient;
  protected databaseName: string;

  constructor(uri: string, databaseName: string) {
    this.client = new MongoClient(uri, {
      serverApi: {
        version: '1',
        strict: true,
        deprecationErrors: true,
      },
    });
    this.databaseName = databaseName;
  }

  protected static getEnvironmentConfig(): { uri: string; databaseName: string } {
    const mongoDbUri = process.env.MONGO_DB_URI || '';
    const mongoDbDatabase = process.env.MONGO_DB_DATABASE || '';

    if (!mongoDbUri || !mongoDbDatabase) {
      throw new Error('Missing required MongoDB configuration.');
    }

    return { uri: mongoDbUri, databaseName: mongoDbDatabase };
  }

  abstract create(data: unknown): Promise<unknown>;
  abstract read(filter: unknown): Promise<unknown[]>;
  abstract update(id: string, data: unknown): Promise<unknown>;
  abstract delete(id: string): Promise<unknown>;
}
