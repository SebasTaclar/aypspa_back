import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { FunctionHandler } from '../src/services/Main';
import { ClientFactory } from '../src/factories/ClientFactory';

const funcGetClients: AzureFunction = async function (
  context: Context,
  req: HttpRequest,
  log: LogModel
): Promise<void> {
  log.logInfo(`Http function processed request for url "${req.url}"`);

  const ClientService = await ClientFactory(log);

  const clients = await ClientService.getAllClients(req.query);
  context.res = { status: 200, body: JSON.stringify(clients) };
};

export = FunctionHandler(funcGetClients);
