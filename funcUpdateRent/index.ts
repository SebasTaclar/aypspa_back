import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { FunctionHandler } from '../src/application/services/Main';
import { RentFactory } from '../src/factories/RentFactory';
import { ClientFactory } from '../src/factories/ClientFactory';
import { ProductFactory } from '../src/factories/ProductFactory';
import { RentService } from '../src/application/services/RentService';
import { ClientService } from '../src/application/services/ClientService';
import { ProductService } from '../src/application/services/ProductService';
import {
  ErrorHandlerMiddleware,
  updateErrorContext,
  ErrorContext,
} from '../src/shared/ErrorHandler';
import { LogModel } from '../src/domain/entities/LogModel';
import { Rent } from '../src/domain/entities/Rent';

const funcUpdateRentImpl = async function (
  context: Context,
  req: HttpRequest,
  log: LogModel,
  errorContext: ErrorContext
): Promise<void> {
  log.logInfo(`🚀 Starting rent update process for URL "${req.url}"`);

  updateErrorContext(errorContext, {
    step: 'validation',
    operation: 'update_rent',
    entityType: 'rent',
  });

  const rentId = req.query.id || (req.params && req.params.id);

  if (!rentId) {
    context.res = {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        error: 'Bad Request',
        message: 'Rent ID is required',
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

  const rentService: RentService = await RentFactory(log);
  const clientService: ClientService = await ClientFactory(log);
  const productService: ProductService = await ProductFactory(log);

  updateErrorContext(errorContext, { step: 'rent_existence_check' });

  // Check if rent exists
  const existingRent = await rentService.getRentById(rentId);
  if (!existingRent) {
    context.res = {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        error: 'Not Found',
        message: 'Rent not found',
      }),
    };
    return;
  }

  // Resolve clientId if clientRut is provided
  let clientId = existingRent.clientId;
  if (req.body.clientRut && req.body.clientRut !== existingRent.clientRut) {
    const clients = await clientService.getAllClients({ rut: req.body.clientRut });
    if (clients.length === 0) {
      context.res = {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: false,
          error: 'Not Found',
          message: `Client with RUT ${req.body.clientRut} not found`,
        }),
      };
      return;
    }
    clientId = parseInt(clients[0].id);
  }

  // Resolve productId if productName is provided
  let productId = existingRent.productId;
  if (req.body.productName && req.body.productName !== existingRent.productName) {
    const products = await productService.getAllProducts({ name: req.body.productName });
    if (products.length === 0) {
      context.res = {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: false,
          error: 'Not Found',
          message: `Product with name ${req.body.productName} not found`,
        }),
      };
      return;
    }
    productId = parseInt(products[0]._id || '0');
  }

  const rentData: Rent = {
    id: rentId,
    code: req.body.code || existingRent.code,
    // Frontend compatibility fields (will be populated from joins)
    productName: req.body.productName || existingRent.productName,
    clientRut: req.body.clientRut || existingRent.clientRut,
    clientName: req.body.clientName || existingRent.clientName,
    // Core rent data
    quantity: req.body.quantity !== undefined ? parseInt(req.body.quantity) : existingRent.quantity,
    totalValuePerDay:
      req.body.totalValuePerDay !== undefined
        ? parseFloat(req.body.totalValuePerDay)
        : existingRent.totalValuePerDay,
    deliveryDate:
      req.body.deliveryDate !== undefined ? req.body.deliveryDate : existingRent.deliveryDate,
    paymentMethod: req.body.paymentMethod || existingRent.paymentMethod,
    warrantyValue:
      req.body.warrantyValue !== undefined
        ? parseFloat(req.body.warrantyValue)
        : existingRent.warrantyValue,
    isFinished: req.body.isFinished !== undefined ? req.body.isFinished : existingRent.isFinished,
    isPaid: req.body.isPaid !== undefined ? req.body.isPaid : existingRent.isPaid,
    totalDays:
      req.body.totalDays !== undefined ? parseFloat(req.body.totalDays) : existingRent.totalDays,
    totalPrice:
      req.body.totalPrice !== undefined ? parseFloat(req.body.totalPrice) : existingRent.totalPrice,
    observations:
      req.body.observations !== undefined ? req.body.observations : existingRent.observations,
    createdAt: existingRent.createdAt,
    // IDs for database operations
    clientId,
    productId,
  };

  log.logInfo(`Updating rent with ID: ${rentId}`);
  const updatedRentId = await rentService.updateRent(rentId, rentData);

  if (!updatedRentId) {
    context.res = {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to update rent',
      }),
    };
    return;
  }

  log.logInfo(`Successfully updated rent with ID: ${updatedRentId}`);

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
      data: { id: updatedRentId },
      message: 'Rent updated successfully',
    }),
  };
};

// Apply both middlewares: first authentication, then error handling
const funcUpdateRent: AzureFunction = FunctionHandler(ErrorHandlerMiddleware(funcUpdateRentImpl));

export = funcUpdateRent;
