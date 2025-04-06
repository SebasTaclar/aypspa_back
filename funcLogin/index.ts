import { AzureFunction, HttpRequest } from '@azure/functions';
import { Context } from 'vm';
import { MongoDbAdapter } from '../src/adapters/MongoDbAdapter';
import { UserService } from '../src/services/UserService';
import { generateToken } from '../src/helpers/jwtHelper';
import { FunctionHandler } from '../src/services/Main';

const funcLogin: AzureFunction = async function (
  context: Context,
  req: HttpRequest,
  log: LogModel
): Promise<void> {
  log.logInfo(`Http function processed request for url "${req.url}"`);

  const dbAdapter = MongoDbAdapter.fromEnvironment();
  const userService = new UserService(dbAdapter);

  try {
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
      username: user.username,
    });

    context.res = {
      status: 200,
      body: token,
    };
  } catch (error) {
    context.log('Error retrieving users:', error);
    context.res = {
      status: 500,
      body: JSON.stringify({ error: 'Failed to retrieve users!' }),
    };
  } finally {
    if (dbAdapter.dispose) {
      await dbAdapter.dispose();
    }
  }
};

export = FunctionHandler(funcLogin, true);
