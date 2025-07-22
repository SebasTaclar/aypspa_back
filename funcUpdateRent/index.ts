import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { FunctionHandler } from '../src/application/services/Main';
import { RentFactory } from '../src/factories/RentFactory';
import { RentService } from '../src/application/services/RentService';
import { LogModel } from '../src/domain/entities/LogModel';
import { Rent } from '../src/domain/entities/Rent';

const funcUpdateRent: AzureFunction = async function (
  context: Context,
  req: HttpRequest,
  log: LogModel
): Promise<void> {
  try {
    log.logInfo(`Http function processed request for url "${req.url}"`);

    const rentId = req.query.id || (req.params && req.params.id);

    if (!rentId) {
      context.res = {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: false,
          error: 'Bad Request',
          message: 'Rent ID is required',
        }),
      };
      return;
    }

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

    const rentService: RentService = await RentFactory(log);

    // Check if rent exists
    const existingRent = await rentService.getRentById(rentId);
    if (!existingRent) {
      context.res = {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: false,
          error: 'Not Found',
          message: 'Rent not found',
        }),
      };
      return;
    }

    const rentData: Rent = {
      id: rentId,
      code: req.body.code || existingRent.code,
      productName: req.body.productName || existingRent.productName,
      quantity:
        req.body.quantity !== undefined ? parseInt(req.body.quantity) : existingRent.quantity,
      totalValuePerDay:
        req.body.totalValuePerDay !== undefined
          ? parseFloat(req.body.totalValuePerDay)
          : existingRent.totalValuePerDay,
      clientRut: req.body.clientRut || existingRent.clientRut,
      deliveryDate:
        req.body.deliveryDate !== undefined ? req.body.deliveryDate : existingRent.deliveryDate,
      paymentMethod: req.body.paymentMethod || existingRent.paymentMethod,
      clientName: req.body.clientName || existingRent.clientName,
      warrantyValue:
        req.body.warrantyValue !== undefined
          ? parseFloat(req.body.warrantyValue)
          : existingRent.warrantyValue,
      isFinished: req.body.isFinished !== undefined ? req.body.isFinished : existingRent.isFinished,
      isPaid: req.body.isPaid !== undefined ? req.body.isPaid : existingRent.isPaid,
      totalDays:
        req.body.totalDays !== undefined ? parseInt(req.body.totalDays) : existingRent.totalDays,
      totalPrice:
        req.body.totalPrice !== undefined
          ? parseFloat(req.body.totalPrice)
          : existingRent.totalPrice,
      observations:
        req.body.observations !== undefined ? req.body.observations : existingRent.observations,
      createdAt: existingRent.createdAt,
    };

    log.logInfo(`Updating rent with ID: ${rentId}`);
    const updatedRentId = await rentService.updateRent(rentId, rentData);

    if (!updatedRentId) {
      context.res = {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: false,
          error: 'Internal Server Error',
          message: 'Failed to update rent',
        }),
      };
      return;
    }

    log.logInfo(`Successfully updated rent with ID: ${updatedRentId}`);

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
        data: { id: updatedRentId },
        message: 'Rent updated successfully',
      }),
    };
  } catch (error) {
    log.logError(`Error in funcUpdateRent: ${error.message}`);
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
        message: 'Failed to update rent',
      }),
    };
  }
};

export = FunctionHandler(funcUpdateRent);
