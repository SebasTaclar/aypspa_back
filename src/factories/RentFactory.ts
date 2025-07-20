import { RentMongoDbAdapter } from '../infrastructure/DbAdapters/RentMongoDbAdapter';
import { RentPrismaAdapter } from '../infrastructure/DbAdapters/RentPrismaAdapter';
import { RentService } from '../application/services/RentService';
import { env_config } from '../config/config';
import { LogModel } from '../domain/entities/LogModel';

export async function RentFactory(log: LogModel): Promise<RentService> {
  log.logInfo('Creating RentService instance...');

  let rentRepository;

  if (env_config.databaseType === 'prisma') {
    log.logInfo('Using Prisma adapter for Rent operations');
    rentRepository = new RentPrismaAdapter();
  } else {
    log.logInfo('Using MongoDB adapter for Rent operations');
    rentRepository = new RentMongoDbAdapter(env_config.mongoDbDatabase);
  }

  return new RentService(rentRepository);
}
