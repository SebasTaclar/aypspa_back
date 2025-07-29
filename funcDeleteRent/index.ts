import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { FunctionHandler } from '../src/application/services/Main';
import { RentFactory } from '../src/factories/RentFactory';
import { RentService } from '../src/application/services/RentService';
import {
  ErrorHandlerMiddleware,
  updateErrorContext,
  ErrorContext,
} from '../src/shared/ErrorHandler';
import { LogModel } from '../src/domain/entities/LogModel';

const funcDeleteRentImpl = async function (
  context: Context,
  req: HttpRequest,
  log: LogModel,
  errorContext: ErrorContext
): Promise<void> {
  log.logInfo(`🚀 Starting rent deletion process for URL "${req.url}"`);

  updateErrorContext(errorContext, {
    step: 'validation',
    operation: 'delete_rent',
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

  updateErrorContext(errorContext, { step: 'service_initialization' });

  const rentService: RentService = await RentFactory(log);

  updateErrorContext(errorContext, { step: 'rent_existence_check' });

  // Check if rent exists before deletion
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

  log.logInfo(`Deleting rent with ID: ${rentId}`);
  const deleteResult = await rentService.deleteRent(rentId);

  if (deleteResult.deletedCount === 0) {
    context.res = {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to delete rent',
      }),
    };
    return;
  }

  log.logInfo(`Successfully deleted rent with ID: ${rentId}`);

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
      message: 'Rent deleted successfully',
      deletedCount: deleteResult.deletedCount,
    }),
  };
};

// Apply both middlewares: first authentication, then error handling
const funcDeleteRent: AzureFunction = FunctionHandler(ErrorHandlerMiddleware(funcDeleteRentImpl));

export = funcDeleteRent;
