import { UserMongoDbAdapter } from '../adapters/UserMongoDbAdapter';
import { User } from '../models/User';

export class UserService {
  private dbAdapter: UserMongoDbAdapter;

  constructor(dbAdapter: UserMongoDbAdapter) {
    if (!dbAdapter) {
      throw new Error('A valid MongoDbAdapter instance is required.');
    }

    this.dbAdapter = dbAdapter;
  }

  public async getAllUsers(req: unknown): Promise<User[]> {
    return await this.dbAdapter.read(req);
  }
}
