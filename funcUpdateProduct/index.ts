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

const funcUpdateProductImpl = async function (
  context: Context,
  req: HttpRequest,
  log: LogModel,
  errorContext: ErrorContext
): Promise<void> {
  log.logInfo(`🚀 Starting product update process for URL "${req.url}"`);

  updateErrorContext(errorContext, {
    step: 'validation',
    operation: 'update_product',
    entityType: 'product',
  });

  if (!req.params.id) {
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

  if (!req.body) {
    context.res = {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        error: 'Bad Request',
        message: 'Request body is required',
      }),
    };
    return;
  }

  updateErrorContext(errorContext, { step: 'service_initialization' });

  const productService: ProductService = await ProductFactory(log);

  updateErrorContext(errorContext, {
    step: 'product_update',
    entityData: req.body,
  });

  log.logInfo(`Updating product with ID: ${req.params.id}`);
  const result = await productService.updateProduct(req.params.id, req.body);

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
        message: 'Product not found',
      }),
    };
    return;
  }

  log.logInfo(`Successfully updated product with ID: ${req.params.id}`);

  context.res = {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
    body: JSON.stringify({
      success: true,
      data: { id: req.params.id },
      message: 'Product updated successfully',
    }),
  };
};

// Apply both middlewares: first authentication, then error handling
const funcUpdateProduct: AzureFunction = FunctionHandler(
  ErrorHandlerMiddleware(funcUpdateProductImpl)
);

export = funcUpdateProduct;
