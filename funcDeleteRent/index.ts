import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { FunctionHandler } from '../src/application/services/Main';
import { RentFactory } from '../src/factories/RentFactory';
import { RentService } from '../src/application/services/RentService';
import { LogModel } from '../src/domain/entities/LogModel';

const funcDeleteRent: AzureFunction = async function (
  context: Context,
  req: HttpRequest,
  log: LogModel
): Promise<void> {
  try {
    log.logInfo(`Http function processed request for url "${req.url}"`);

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

    const rentService: RentService = await RentFactory(log);

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
  } catch (error) {
    log.logError(`Error in funcDeleteRent: ${error.message}`);
    log.logError(`Stack trace: ${error.stack}`);

    context.res = {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: 'Failed to delete rent',
      }),
    };
  }
};

export = FunctionHandler(funcDeleteRent);
