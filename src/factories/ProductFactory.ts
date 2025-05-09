import { ProductMongoDbAdapter } from '../infrastructure/DbAdapters/ProductMongoDbAdapter';
import { ProductService } from '../application/services/ProductService';
import { env_config } from '../config/config';

export async function ProductFactory(log: LogModel): Promise<ProductService> {
  log.logInfo('Creating ProductService instance...');
  const productRepository = new ProductMongoDbAdapter(env_config.mongoDbDatabase);
  return new ProductService(productRepository);
}
