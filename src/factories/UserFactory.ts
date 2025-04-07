import { UserMongoDbAdapter } from '../adapters/UserMongoDbAdapter';
import { UserService } from '../services/UserService';

export async function UserFactory(log: LogModel): Promise<UserService> {
  log.logInfo('Creating UserService instance...');
  const dbAdapter: UserMongoDbAdapter = UserMongoDbAdapter.fromEnvironment();
  return new UserService(dbAdapter);
}
