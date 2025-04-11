import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { ClientService } from '../src/application/services/ClientService';
import { ClientFactory } from '../src/factories/ClientFactory';
import { FunctionHandler } from '../src/application/services/Main';

const funcUpdateClient: AzureFunction = async function (
  context: Context,
  req: HttpRequest,
  log: LogModel
): Promise<void> {
  log.logInfo(`Http function processed request for url "${req.url}"`);
  const ClientService: ClientService = await ClientFactory(log);
  const clients = await ClientService.updateClient(req.query.id, req.body);
  context.res = { status: 200, body: JSON.stringify(clients) };
};

export default FunctionHandler(funcUpdateClient);
