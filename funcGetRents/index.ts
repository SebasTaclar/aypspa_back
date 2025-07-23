import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { FunctionHandler } from '../src/application/services/Main';
import { RentFactory } from '../src/factories/RentFactory';
import { RentService } from '../src/application/services/RentService';
import { LogModel } from '../src/domain/entities/LogModel';
import { PaginationOptions } from '../src/domain/interfaces/IRentDataSource';

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

    // Extract pagination parameters for finished rents
    const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : undefined;
    delete queryParams.page;
    delete queryParams.pageSize;

    const pagination: PaginationOptions | undefined =
      page && pageSize ? { page, pageSize } : undefined;

    let result;

    switch (rentType?.toLowerCase()) {
      case 'active': {
        log.logInfo('Fetching active rents');
        const activeRents = await rentService.getActiveRents(queryParams);
        result = {
          success: true,
          data: activeRents,
          count: activeRents.length,
          type: 'active',
        };
        break;
      }
      case 'finished': {
        log.logInfo('Fetching finished rents with pagination');
        const finishedRentsResult = await rentService.getFinishedRents(queryParams, pagination);
        result = {
          success: true,
          data: finishedRentsResult.data,
          count: finishedRentsResult.data.length,
          type: 'finished',
          pagination: {
            totalCount: finishedRentsResult.totalCount,
            totalPages: finishedRentsResult.totalPages,
            currentPage: finishedRentsResult.currentPage,
            pageSize: finishedRentsResult.pageSize,
          },
        };
        break;
      }
      default: {
        log.logInfo('Fetching all rents');
        const allRents = await rentService.getAllRents(queryParams);
        result = {
          success: true,
          data: allRents,
          count: allRents.length,
          type: 'all',
        };
        break;
      }
    }

    log.logInfo(`Successfully retrieved ${result.count} rents`);

    context.res = {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: JSON.stringify(result),
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
