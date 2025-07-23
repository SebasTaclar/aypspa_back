import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { FunctionHandler } from '../src/application/services/Main';
import { UserFactory } from '../src/factories/UserFactory';
import { UserService } from '../src/application/services/UserService';
import { LogModel } from '../src/domain/entities/LogModel';

const funcUpdateUserMembership: AzureFunction = async function (
  context: Context,
  req: HttpRequest,
  log: LogModel
): Promise<void> {
  try {
    log.logInfo(`Http function processed request for url "${req.url}"`);

    if (!req.body || !req.body.userId || req.body.membershipPaid === undefined) {
      context.res = {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: false,
          error: 'Bad Request',
          message: 'userId and membershipPaid fields are required',
        }),
      };
      return;
    }

    // Initialize user service
    const userService: UserService = await UserFactory(log);

    // Get the existing user
    const existingUser = await userService.getUserById(req.body.userId);
    if (!existingUser) {
      context.res = {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: false,
          error: 'Not Found',
          message: `User with ID ${req.body.userId} not found`,
        }),
      };
      return;
    }

    // Update the membership status
    const updatedUser = await userService.updateUser(req.body.userId, {
      membershipPaid: req.body.membershipPaid,
    });

    if (!updatedUser) {
      context.res = {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: false,
          error: 'Internal Server Error',
          message: 'Failed to update user membership status',
        }),
      };
      return;
    }

    log.logInfo(`Successfully updated membership status for user ID: ${req.body.userId}`);

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
        data: {
          id: updatedUser.id,
          username: updatedUser.username,
          name: updatedUser.name,
          role: updatedUser.role,
          membershipPaid: updatedUser.membershipPaid,
        },
        message: 'User membership status updated successfully',
      }),
    };
  } catch (error) {
    log.logError(`Error in funcUpdateUserMembership: ${error.message}`);
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
        message: 'Failed to update user membership status',
      }),
    };
  }
};

export = FunctionHandler(funcUpdateUserMembership);
