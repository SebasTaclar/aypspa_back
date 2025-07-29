import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { FunctionHandler } from '../src/application/services/Main';
import {
  ErrorHandlerMiddleware,
  updateErrorContext,
  ErrorContext,
} from '../src/shared/ErrorHandler';
import { ProductFactory } from '../src/factories/ProductFactory';
import { ProductService } from '../src/application/services/ProductService';
import { LogModel } from '../src/domain/entities/LogModel';

const funcCreateProductImpl = async function (
  context: Context,
  req: HttpRequest,
  log: LogModel,
  errorContext: ErrorContext
): Promise<void> {
  log.logInfo(`🚀 Starting product creation process for URL "${req.url}"`);

  updateErrorContext(errorContext, {
    step: 'validation',
    operation: 'product_creation',
    entityType: 'product',
  });

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
  log.logInfo(`✅ ProductService initialized successfully`);

  updateErrorContext(errorContext, {
    step: 'product_creation',
    entityData: req.body,
    creationState: { productCreated: false },
  });

  log.logInfo(`📝 Creating product with data: ${JSON.stringify(req.body, null, 2)}`);
  const createdProduct = await productService.createProduct(req.body);

  updateErrorContext(errorContext, {
    creationState: { productCreated: true },
  });

  log.logInfo(`✅ Successfully created product with ID: ${createdProduct._id}`);

  context.res = {
    status: 201,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
    body: JSON.stringify({
      success: true,
      data: createdProduct,
      message: 'Product created successfully',
    }),
  };
};

// Apply both middlewares: first authentication, then error handling
const funcCreateProduct: AzureFunction = FunctionHandler(
  ErrorHandlerMiddleware(funcCreateProductImpl)
);

export = funcCreateProduct;
