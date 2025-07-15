import { ProductMongoDbAdapter } from '../infrastructure/DbAdapters/ProductMongoDbAdapter';
import { ProductPrismaAdapter } from '../infrastructure/DbAdapters/ProductPrismaAdapter';
import { ProductService } from '../application/services/ProductService';
import { env_config } from '../config/config';
import { LogModel } from '../domain/entities/LogModel';

export async function ProductFactory(log: LogModel): Promise<ProductService> {
  log.logInfo('Creating ProductService instance...');

  let productRepository;

  if (env_config.databaseType === 'prisma') {
    productRepository = new ProductPrismaAdapter();
  } else {
    productRepository = new ProductMongoDbAdapter(env_config.mongoDbDatabase);
  }

  return new ProductService(productRepository);
}
