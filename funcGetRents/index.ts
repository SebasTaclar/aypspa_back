import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { FunctionHandler } from '../src/application/services/Main';
import { RentFactory } from '../src/factories/RentFactory';
import { RentService } from '../src/application/services/RentService';
import { LogModel } from '../src/domain/entities/LogModel';

const funcGetRents: AzureFunction = async function (
  context: Context,
  req: HttpRequest,
  log: LogModel
): Promise<void> {
  try {
    log.logInfo(`Http function processed request for url "${req.url}"`);
    log.logInfo(`Query parameters: ${JSON.stringify(req.query)}`);

    const rentService: RentService = await RentFactory(log);

    // Extract the type parameter to determine which rents to return
    const rentType = req.query.type as string;
    const queryParams = { ...req.query };
    delete queryParams.type; // Remove type from query params to avoid interference

    let rents;

    switch (rentType?.toLowerCase()) {
      case 'active':
        log.logInfo('Fetching active rents');
        rents = await rentService.getActiveRents(queryParams);
        break;
      case 'finished':
        log.logInfo('Fetching finished rents');
        rents = await rentService.getFinishedRents(queryParams);
        break;
      default:
        log.logInfo('Fetching all rents');
        rents = await rentService.getAllRents(queryParams);
        break;
    }

    log.logInfo(`Successfully retrieved ${rents.length} rents`);

    context.res = {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: JSON.stringify({
        success: true,
        data: rents,
        count: rents.length,
        type: rentType || 'all',
      }),
    };
  } catch (error) {
    log.logError(`Error in funcGetRents: ${error.message}`);
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
        message: 'Failed to retrieve rents',
      }),
    };
  }
};

export = FunctionHandler(funcGetRents);
