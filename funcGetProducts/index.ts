import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { ProductService } from '../src/application/services/ProductService';
import { ProductFactory } from '../src/factories/ProductFactory';
import { FunctionHandler } from '../src/application/services/Main';
import {
  ErrorHandlerMiddleware,
  updateErrorContext,
  ErrorContext,
} from '../src/shared/ErrorHandler';
import { LogModel } from '../src/domain/entities/LogModel';

const funcGetProductsImpl = async function (
  context: Context,
  req: HttpRequest,
  log: LogModel,
  errorContext: ErrorContext
): Promise<void> {
  log.logInfo(`🚀 Starting get products process for URL "${req.url}"`);

  updateErrorContext(errorContext, {
    step: 'initialization',
    operation: 'get_products',
    entityType: 'product',
    entityData: { query: req.query },
  });

  const productService: ProductService = await ProductFactory(log);
  log.logInfo(`✅ ProductService initialized successfully`);

  updateErrorContext(errorContext, { step: 'get_all_products' });

  const products = await productService.getAllProducts(req.query);
  log.logInfo(`✅ Retrieved ${products.length} products`);

  context.res = {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      success: true,
      data: products,
    }),
  };
};

// Apply both middlewares: first authentication, then error handling
const funcGetProducts: AzureFunction = FunctionHandler(ErrorHandlerMiddleware(funcGetProductsImpl));

export = funcGetProducts;
