import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { ProductService } from '../src/application/services/ProductService';
import { ProductFactory } from '../src/factories/ProductFactory';
import { FunctionHandler } from '../src/application/services/Main';
import { LogModel } from '../src/domain/entities/LogModel';

const funcUpdateProduct: AzureFunction = async function (
  context: Context,
  req: HttpRequest,
  log: LogModel
): Promise<void> {
  log.logInfo(`Http function processed request for url "${req.url}"`);
  const productService: ProductService = await ProductFactory(log);
  const result = await productService.updateProduct(req.params.id, req.body);
  context.res = {
    status: result ? 200 : 404,
    body: JSON.stringify({
      success: !!result,
      message: result ? 'Product updated' : 'Product not found',
    }),
  };
};

export = FunctionHandler(funcUpdateProduct);
