import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { FunctionHandler } from '../src/application/services/Main';
import {
  ErrorHandlerMiddleware,
  updateErrorContext,
  ErrorContext,
} from '../src/shared/ErrorHandler';
import { ClientFactory } from '../src/factories/ClientFactory';
import { ClientService } from '../src/application/services/ClientService';
import { LogModel } from '../src/domain/entities/LogModel';

const funcGetClientsImpl = async function (
  context: Context,
  req: HttpRequest,
  log: LogModel,
  errorContext: ErrorContext
): Promise<void> {
  log.logInfo(`🚀 Starting get clients process for URL "${req.url}"`);

  updateErrorContext(errorContext, {
    step: 'initialization',
    operation: 'get_clients',
    entityType: 'client',
  });

  const clientService: ClientService = await ClientFactory(log);
  const clientId = req.params.id || req.query.id;

  if (clientId) {
    updateErrorContext(errorContext, {
      step: 'get_by_id',
      entityData: { clientId },
    });

    // Get specific client by ID
    log.logInfo(`Getting client with ID: ${clientId}`);
    const client = await clientService.getClientById(clientId);

    if (!client) {
      context.res = {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: false,
          error: 'Not Found',
          message: `Client with ID ${clientId} not found`,
        }),
      };
      return;
    }

    context.res = {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        data: client,
      }),
    };
  } else {
    updateErrorContext(errorContext, {
      step: 'get_all',
      entityData: { query: req.query },
    });

    // Get all clients
    log.logInfo('Getting all clients');
    const clients = await clientService.getAllClients(req.query);

    context.res = {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        data: clients,
      }),
    };
  }
};

// Apply both middlewares: first authentication, then error handling
const funcGetClients: AzureFunction = FunctionHandler(ErrorHandlerMiddleware(funcGetClientsImpl));

export = funcGetClients;
