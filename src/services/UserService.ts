import { MongoDbAdapter } from '../adapters/MongoDbAdapter';
import { User } from '../models/User';

export class UserService {
  private dbAdapter: MongoDbAdapter;

  constructor(dbAdapter: MongoDbAdapter) {
    if (!dbAdapter) {
      throw new Error('A valid MongoDbAdapter instance is required.');
    }

    this.dbAdapter = dbAdapter;
  }

  public async getAllUsers(req: unknown): Promise<User[]> {
    return await this.dbAdapter.getAllUsers(req);
  }

  public async dispose(): Promise<void> {
    await this.dbAdapter.dispose();
  }
}
