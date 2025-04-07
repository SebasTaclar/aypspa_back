import { ObjectId } from 'mongodb';
import { MongoDbAdapter } from './MongoDbAdapter';
import { User } from '../models/User';

export class UserMongoDbAdapter extends MongoDbAdapter {
  private collection: string = 'users';

  constructor(uri: string, databaseName: string) {
    super(uri, databaseName);
  }

  public static fromEnvironment(): UserMongoDbAdapter {
    const { uri, databaseName } = this.getEnvironmentConfig();
    return new UserMongoDbAdapter(uri, databaseName);
  }

  public async create(data: User): Promise<User> {
    const database = this.client.db(this.databaseName);
    const result = await database.collection(this.collection).insertOne(data);
    return { ...data, id: result.insertedId.toString() };
  }

  public async read(filter: unknown): Promise<User[]> {
    const database = this.client.db(this.databaseName);
    const users = await database.collection(this.collection).find(filter).toArray();

    return users.map((user) => {
      return {
        id: user._id.toString(),
        username: user.username || '',
        password: user.password || '',
        name: user.name || '',
        role: user.role || '',
      } as User;
    });
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
}
