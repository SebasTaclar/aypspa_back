import { UserMongoDbAdapter } from '../infrastructure/DbAdapters/UserMongoDbAdapter';
import { UserPrismaAdapter } from '../infrastructure/DbAdapters/UserPrismaAdapter';
import { UserService } from '../application/services/UserService';
import { env_config } from '../config/config';
import { LogModel } from '../domain/entities/LogModel';

export async function UserFactory(log: LogModel): Promise<UserService> {
  log.logInfo('Creating UserService instance...');

  let userRepository;

  if (env_config.databaseType === 'prisma') {
    userRepository = new UserPrismaAdapter();
  } else {
    userRepository = new UserMongoDbAdapter(env_config.mongoDbDatabase);
  }

  return new UserService(userRepository);
}
