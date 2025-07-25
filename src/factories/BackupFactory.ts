import { BackupService } from '../application/services/BackupService';
import { ClientFactory } from './ClientFactory';
import { ProductFactory } from './ProductFactory';
import { RentFactory } from './RentFactory';
import { LogModel } from '../domain/entities/LogModel';

export const BackupFactory = async (log: LogModel): Promise<BackupService> => {
  const clientService = await ClientFactory(log);
  const productService = await ProductFactory(log);
  const rentService = await RentFactory(log);

  return new BackupService(clientService, productService, rentService, log);
};
