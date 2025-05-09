import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { ProductService } from '../src/application/services/ProductService';
import { ProductFactory } from '../src/factories/ProductFactory';
import { FunctionHandler } from '../src/application/services/Main';

const funcGetProducts: AzureFunction = async function (
  context: Context,
  req: HttpRequest,
  log: LogModel
): Promise<void> {
  log.logInfo(`Http function processed request for url "${req.url}"`);
  const ProductService: ProductService = await ProductFactory(log);
  const products = await ProductService.getAllProducts(req.query);
  context.res = { status: 200, body: JSON.stringify(products) };
};

export = FunctionHandler(funcGetProducts);
