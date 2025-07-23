import { AzureFunction, HttpRequest } from '@azure/functions';
import { Context } from 'vm';
import { generateToken } from '../src/shared/jwtHelper';
import { FunctionHandler } from '../src/application/services/Main';
import { UserFactory } from '../src/factories/UserFactory';
import { UserService } from '../src/application/services/UserService';
import { LogModel } from '../src/domain/entities/LogModel';

const funcLogin: AzureFunction = async function (
  context: Context,
  req: HttpRequest,
  log: LogModel
): Promise<void> {
  log.logInfo(`Http function processed request for url "${req.url}"`);

  const userService: UserService = await UserFactory(log);
  const users = await userService.getAllUsers(req.query);
  const user = users.length > 0 ? users[0] : null;

  if (!user) {
    context.res = {
      status: 401,
      body: JSON.stringify({ error: 'Invalid credentials' }),
    };
    return;
  }

  const token = generateToken({
    id: user.id,
    role: user.role,
    name: user.name,
    username: user.username,
    membershipPaid: user.membershipPaid,
  });

  context.res = {
    status: 200,
    body: token,
  };
};

export = FunctionHandler(funcLogin, true);
