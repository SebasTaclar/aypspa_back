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

const funcDeleteProductImpl = async function (
  context: Context,
  req: HttpRequest,
  log: LogModel,
  errorContext: ErrorContext
): Promise<void> {
  log.logInfo(`🚀 Starting product deletion process for URL "${req.url}"`);

  updateErrorContext(errorContext, {
    step: 'validation',
    operation: 'delete_product',
    entityType: 'product',
  });

  const productId = req.params.id || req.query.id;
  if (!productId) {
    context.res = {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        error: 'Bad Request',
        message: 'Product ID is required',
      }),
    };
    return;
  }

  updateErrorContext(errorContext, { step: 'service_initialization' });

  const productService: ProductService = await ProductFactory(log);

  updateErrorContext(errorContext, {
    step: 'product_deletion',
    entityData: { productId },
  });

  log.logInfo(`Deleting product with ID: ${productId}`);
  const result = await productService.deleteProduct(productId);

  if (!result) {
    context.res = {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        error: 'Not Found',
        message: `Product with ID ${productId} not found`,
      }),
    };
    return;
  }

  log.logInfo(`Successfully deleted product with ID: ${productId}`);

  context.res = {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
    body: JSON.stringify({
      success: true,
      data: { id: productId },
      message: 'Product deleted successfully',
    }),
  };
};

// Apply both middlewares: first authentication, then error handling
const funcDeleteProduct: AzureFunction = FunctionHandler(
  ErrorHandlerMiddleware(funcDeleteProductImpl)
);

export = funcDeleteProduct;
