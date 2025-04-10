import { UserMongoDbAdapter } from '../infrastructure/DbAdapters/UserMongoDbAdapter';
import { UserService } from '../application/services/UserService';
import { env_config } from '../config/config';

export async function UserFactory(log: LogModel): Promise<UserService> {
  log.logInfo('Creating UserService instance...');
  const userRepository = new UserMongoDbAdapter(env_config.mongoDbDatabase);
  return new UserService(userRepository);
}
