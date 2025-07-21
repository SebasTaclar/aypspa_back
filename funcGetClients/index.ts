import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { FunctionHandler } from '../src/application/services/Main';
import { ClientFactory } from '../src/factories/ClientFactory';
import { ClientService } from '../src/application/services/ClientService';
import { LogModel } from '../src/domain/entities/LogModel';

const funcGetClients: AzureFunction = async function (
  context: Context,
  req: HttpRequest,
  log: LogModel
): Promise<void> {
  try {
    log.logInfo(`Http function processed request for url "${req.url}"`);

    const clientService: ClientService = await ClientFactory(log);
    const clientId = req.params.id || req.query.id;

    if (clientId) {
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
  } catch (error) {
    log.logError(`Error in funcGetClients: ${error.message}`);
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
        message: 'Failed to get clients',
      }),
    };
  }
};

export = FunctionHandler(funcGetClients);
