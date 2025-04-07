import { MongoDbAdapter } from '../adapters/MongoDbAdapter';
import { UserService } from '../services/UserService';

export async function UserFactory(log: LogModel): Promise<UserService> {
  log.logInfo('Creating UserService instance...');
  const dbAdapter = MongoDbAdapter.fromEnvironment();
  return new UserService(dbAdapter);
}
