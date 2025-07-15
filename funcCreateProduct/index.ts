import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { FunctionHandler } from '../src/application/services/Main';
import { ProductFactory } from '../src/factories/ProductFactory';
import { ProductService } from '../src/application/services/ProductService';
import { LogModel } from '../src/domain/entities/LogModel';

const funcCreateProduct: AzureFunction = async function (
  context: Context,
  req: HttpRequest,
  log: LogModel
): Promise<void> {
  log.logInfo(`Http function processed request for url "${req.url}"`);
  const ProductService: ProductService = await ProductFactory(log);
  const products = await ProductService.createProduct(req.body);
  context.res = { status: 200, body: JSON.stringify(products) };
};

export = FunctionHandler(funcCreateProduct);
