import { ObjectId } from 'mongodb';
import { MongoDbAdapter } from './MongoDbAdapter';
import { User } from '../models/User'; // Replace with the appropriate Client model if available

export class ClientMongoDbAdapter extends MongoDbAdapter {
  private collection: string = 'clients';

  constructor(uri: string, databaseName: string) {
    super(uri, databaseName);
  }

  public static fromEnvironment(): ClientMongoDbAdapter {
    const { uri, databaseName } = this.getEnvironmentConfig();
    return new ClientMongoDbAdapter(uri, databaseName);
  }

  public async create(data: User): Promise<User> {
    const database = this.client.db(this.databaseName);
    const result = await database.collection(this.collection).insertOne(data);
    return { ...data, id: result.insertedId.toString() };
  }

  public async read(filter: unknown): Promise<User[]> {
    const database = this.client.db(this.databaseName);
    const users = await database.collection(this.collection).find(filter).toArray();
    return users.map((user) => ({
      ...user,
      id: user._id.toString(),
      username: user.username || '',
      password: user.password || '',
      role: user.role || '',
      token: user.token || '',
    }));
  }

  public async update(id: string, data: Partial<User>): Promise<User | null> {
    const database = this.client.db(this.databaseName);
    const result = await database
      .collection(this.collection)
      .findOneAndUpdate({ _id: new ObjectId(id) }, { $set: data }, { returnDocument: 'after' });
    return result.value ? { ...result.value, id: result.value._id.toString() } : null;
  }

  public async delete(id: string): Promise<boolean> {
    const database = this.client.db(this.databaseName);
    const result = await database.collection(this.collection).deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount === 1;
  }

  public async getUserById(id: string): Promise<User | null> {
    const users = await this.read({ _id: new ObjectId(id) });
    return users.length > 0 ? users[0] : null;
  }

  public async getAllUsers(): Promise<User[]> {
    return this.read({});
  }
}
