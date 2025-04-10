import { Collection, ObjectId } from 'mongodb';
import { connectMongoClient, mongoClient } from '../../config/MongoClient';
import { IUserDataSource } from '../../domain/interfaces/IUserDataSource';
import { User } from '../../domain/entities/User';

export class UserMongoDbAdapter implements IUserDataSource {
  private readonly collectionName = 'users';
  private readonly databaseName: string;

  constructor(databaseName: string) {
    this.databaseName = databaseName;
  }

  private async getCollection(): Promise<Collection> {
    await connectMongoClient();
    const database = mongoClient.db(this.databaseName);
    return database.collection(this.collectionName);
  }

  private async withCollection<T>(callback: (collection: Collection) => Promise<T>): Promise<T> {
    const collection = await this.getCollection();
    return callback(collection);
  }

  public async getAll(query?: unknown): Promise<User[]> {
    const response = this.withCollection(async (collection) => {
      const users = await collection.find(query || {}).toArray();
      return users.map(
        (user) =>
          ({
            id: user._id.toString(),
            username: user.username || '',
            password: user.password || '',
            name: user.name || '',
            role: user.role || '',
          }) as User
      );
    });

    return response;
  }

  public async getById(id: string): Promise<User | null> {
    const response = this.withCollection(async (collection) => {
      const user = await collection.findOne({ _id: new ObjectId(id) });
      if (!user) return null;
      return {
        id: user._id.toString(),
        username: user.username || '',
        password: user.password || '',
        name: user.name || '',
        role: user.role || '',
      } as User;
    });

    return response;
  }

  public async create(user: User): Promise<User> {
    const response = this.withCollection(async (collection) => {
      const result = await collection.insertOne(user);
      return { ...user, id: result.insertedId.toString() };
    });

    return response;
  }

  public async update(id: string, user: Partial<User>): Promise<User | null> {
    const response = this.withCollection(async (collection) => {
      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: user },
        { returnDocument: 'after' }
      );
      return result.value ? { ...result.value, id: result.value._id.toString() } : null;
    });

    return response;
  }

  public async delete(id: string): Promise<boolean> {
    const response = this.withCollection(async (collection) => {
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount === 1;
    });

    return response;
  }
}
