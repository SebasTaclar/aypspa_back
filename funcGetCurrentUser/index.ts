import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { FunctionHandler } from '../src/application/services/Main';
import { UserFactory } from '../src/factories/UserFactory';
import { UserService } from '../src/application/services/UserService';
import { verifyToken } from '../src/shared/jwtHelper';
import { LogModel } from '../src/domain/entities/LogModel';

const funcGetCurrentUser: AzureFunction = async function (
  context: Context,
  req: HttpRequest,
  log: LogModel
): Promise<void> {
  try {
    log.logInfo(`Http function processed request for url "${req.url}"`);

    // Get authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      context.res = {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: false,
          error: 'Unauthorized',
          message: 'No authorization token provided',
        }),
      };
      return;
    }

    // Extract and verify token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    let tokenPayload;

    try {
      tokenPayload = verifyToken(token);
    } catch (error) {
      context.res = {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: false,
          error: 'Unauthorized',
          message: 'Invalid token',
        }),
      };
      return;
    }

    // Initialize user service and get FRESH user data from database
    const userService: UserService = await UserFactory(log);
    const currentUser = await userService.getUserById(tokenPayload.id);

    if (!currentUser) {
      context.res = {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: false,
          error: 'Not Found',
          message: 'User not found',
        }),
      };
      return;
    }

    // Return fresh user data without password
    const userResponse = {
      id: currentUser.id,
      username: currentUser.username,
      name: currentUser.name,
      role: currentUser.role,
      membershipPaid: currentUser.membershipPaid,
    };

    log.logInfo(
      `Successfully retrieved current user: ${currentUser.username}, membershipPaid: ${currentUser.membershipPaid}`
    );

    context.res = {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: JSON.stringify({
        success: true,
        data: userResponse,
        message: 'User retrieved successfully',
      }),
    };
  } catch (error) {
    log.logError(`Error in funcGetCurrentUser: ${error.message}`);
    log.logError(`Stack trace: ${error.stack}`);

    context.res = {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to retrieve user',
      }),
    };
  }
};

export = FunctionHandler(funcGetCurrentUser);
