import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { ClientService } from '../src/application/services/ClientService';
import { ClientFactory } from '../src/factories/ClientFactory';
import { FunctionHandler } from '../src/application/services/Main';
import {
  ErrorHandlerMiddleware,
  updateErrorContext,
  ErrorContext,
} from '../src/shared/ErrorHandler';
import { LogModel } from '../src/domain/entities/LogModel';
import { Client } from '../src/domain/entities/Client';

const funcUpdateClientImpl = async function (
  context: Context,
  req: HttpRequest,
  log: LogModel,
  errorContext: ErrorContext
): Promise<void> {
  log.logInfo(`🚀 Starting client update process for URL "${req.url}"`);

  updateErrorContext(errorContext, {
    step: 'validation',
    operation: 'update_client',
    entityType: 'client',
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

  const clientId = req.params.id;
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

  updateErrorContext(errorContext, { step: 'field_validation' });

  // Validate required fields
  const requiredFields = ['name'];
  const missingFields = requiredFields.filter((field) => !req.body[field]);

  if (missingFields.length > 0) {
    context.res = {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        error: 'Bad Request',
        message: `Missing required fields: ${missingFields.join(', ')}`,
      }),
    };
    return;
  }

  // Create client data for update
  const clientData: Client = {
    id: clientId,
    name: req.body.name,
    companyName: req.body.companyName || '',
    companyDocument: req.body.companyDocument || '',
    rut: req.body.rut || '',
    phoneNumber: req.body.phoneNumber || '',
    address: req.body.address || '',
    creationDate: req.body.creationDate || '',
    frequentClient: req.body.frequentClient || '',
    created: req.body.created || '',
    photoFileName: req.body.photoFileName || undefined,
  };

  updateErrorContext(errorContext, {
    step: 'client_update',
    entityData: clientData,
  });

  log.logInfo(`Updating client with ID: ${clientId}`);
  const updatedClientId = await clientService.updateClient(clientId, clientData);

  if (!updatedClientId) {
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

  log.logInfo(`Successfully updated client with ID: ${updatedClientId}`);

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
      data: { id: updatedClientId },
      message: 'Client updated successfully',
    }),
  };
};

// Apply both middlewares: first authentication, then error handling
const funcUpdateClient: AzureFunction = FunctionHandler(
  ErrorHandlerMiddleware(funcUpdateClientImpl)
);

export = funcUpdateClient;
