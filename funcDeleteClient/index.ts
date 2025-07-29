import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { FunctionHandler } from '../src/application/services/Main';
import { ClientService } from '../src/application/services/ClientService';
import { ClientFactory } from '../src/factories/ClientFactory';
import {
  ErrorHandlerMiddleware,
  updateErrorContext,
  ErrorContext,
} from '../src/shared/ErrorHandler';
import { LogModel } from '../src/domain/entities/LogModel';

const funcDeleteClientImpl = async function (
  context: Context,
  req: HttpRequest,
  log: LogModel,
  errorContext: ErrorContext
): Promise<void> {
  log.logInfo(`🚀 Starting client deletion process for URL "${req.url}"`);

  updateErrorContext(errorContext, {
    step: 'validation',
    operation: 'delete_client',
    entityType: 'client',
  });

  const clientId = req.query.id || req.params.id;
  if (!clientId) {
    context.res = {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        error: 'Bad Request',
        message: 'Client ID is required',
      }),
    };
    return;
  }

  updateErrorContext(errorContext, { step: 'service_initialization' });

  const clientService: ClientService = await ClientFactory(log);

  updateErrorContext(errorContext, {
    step: 'client_deletion',
    entityData: { clientId },
  });

  log.logInfo(`Deleting client with ID: ${clientId}`);
  const result = await clientService.deleteClient(clientId);

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
        message: `Client with ID ${clientId} not found`,
      }),
    };
    return;
  }

  log.logInfo(`Successfully deleted client with ID: ${clientId}`);

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
      data: result,
      message: 'Client deleted successfully',
    }),
  };
};

// Apply both middlewares: first authentication, then error handling
const funcDeleteClient: AzureFunction = FunctionHandler(
  ErrorHandlerMiddleware(funcDeleteClientImpl)
);

export = funcDeleteClient;
