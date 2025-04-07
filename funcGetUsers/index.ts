import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { FunctionHandler } from '../src/services/Main';
import { UserFactory } from '../src/factories/UserFactory';

const funcGetUsers: AzureFunction = async (
  context: Context,
  req: HttpRequest,
  log: LogModel
): Promise<void> => {
  log.logInfo(`Http function processed request for url "${req.url}"`);

  const userService = await UserFactory(log);

  const users = await userService.getAllUsers(req.query);
  context.res = { status: 200, body: JSON.stringify(users) };
};

export = FunctionHandler(funcGetUsers);
