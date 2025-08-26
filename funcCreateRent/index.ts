import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { FunctionHandler } from '../src/application/services/Main';
import {
  ErrorHandlerMiddleware,
  updateErrorContext,
  ErrorContext,
} from '../src/shared/ErrorHandler';
import { RentFactory } from '../src/factories/RentFactory';
import { ClientFactory } from '../src/factories/ClientFactory';
import { ProductFactory } from '../src/factories/ProductFactory';
import { RentService } from '../src/application/services/RentService';
import { ClientService } from '../src/application/services/ClientService';
import { ProductService } from '../src/application/services/ProductService';
import { Rent } from '../src/domain/entities/Rent';
import { LogModel } from '../src/domain/entities/LogModel';

const funcCreateRentImpl = async function (
  context: Context,
  req: HttpRequest,
  log: LogModel,
  errorContext: ErrorContext
): Promise<void> {
  log.logInfo(`🚀 Starting rent creation process for URL "${req.url}"`);

  updateErrorContext(errorContext, {
    step: 'validation',
    operation: 'rent_creation',
    entityType: 'rent',
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

  // Log the incoming payload for debugging
  log.logInfo(`📥 Received payload: ${JSON.stringify(req.body, null, 2)}`);

  updateErrorContext(errorContext, { step: 'service_initialization' });

  // Initialize services - let errors bubble up to middleware
  const rentService: RentService = await RentFactory(log);
  const clientService: ClientService = await ClientFactory(log);
  const productService: ProductService = await ProductFactory(log);

  log.logInfo(`✅ Services initialized successfully`);

  updateErrorContext(errorContext, { step: 'field_validation' });

  // Validate required fields
  const requiredFields = [
    'code',
    'productName',
    'quantity',
    'totalValuePerDay',
    'clientRut',
    'clientName',
  ];
  // Note: productId is optional - if not provided, we create a new product
  const missingFields = requiredFields.filter((field) => !req.body[field]);

  // Special validation for warrantyValue - allow 0 but not undefined/null/empty
  if (
    req.body.warrantyValue === undefined ||
    req.body.warrantyValue === null ||
    req.body.warrantyValue === ''
  ) {
    missingFields.push('warrantyValue');
  }

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

  updateErrorContext(errorContext, {
    step: 'client_lookup_and_creation',
    entityType: 'client',
    entityData: { rut: req.body.clientRut, name: req.body.clientName },
  });

  // Find or create client by RUT - let errors bubble up
  const clients = await clientService.getAllClients({ rut: req.body.clientRut });
  let client;

  log.logInfo(`🔍 Client lookup completed. Found ${clients.length} clients`);

  if (clients.length === 0) {
    // Client doesn't exist, create it
    log.logInfo(`👤 Client with RUT ${req.body.clientRut} not found, creating new client`);

    const newClientData = {
      id: '', // Will be auto-generated
      name: req.body.clientName,
      companyName: '', // Default empty
      companyDocument: '',
      rut: req.body.clientRut,
      phoneNumber: '',
      address: '',
      creationDate: new Date().toISOString().split('T')[0], // Today's date
      frequentClient: 'No', // Default value
      created: new Date().toISOString(),
    };

    updateErrorContext(errorContext, {
      entityData: newClientData,
      creationState: { clientCreated: false },
    });

    client = await clientService.createClient(newClientData);

    updateErrorContext(errorContext, {
      creationState: { clientCreated: true },
    });

    log.logInfo(`✅ Successfully created new client with ID: ${client.id}`);
  } else {
    client = clients[0];
    log.logInfo(`✅ Found existing client with ID: ${client.id}`);
  }

  updateErrorContext(errorContext, {
    step: 'product_lookup_and_creation',
    entityType: 'product',
    entityData: { code: req.body.code, name: req.body.productName },
  });

  // Find or create product based on productId from frontend
  let product;

  // If productId is provided, get existing product by ID
  if (req.body.productId) {
    product = await productService.getProductById(req.body.productId);

    if (!product) {
      log.logError(`❌ Product with ID "${req.body.productId}" not found`);
      context.res = {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: false,
          error: 'Not Found',
          message: `Product with ID "${req.body.productId}" not found`,
        }),
      };
      return;
    }

    log.logInfo(
      `✅ Found existing product by ID "${req.body.productId}": ${product.name} (${product.code})`
    );
  } else {
    // If no productId provided, create new product
    log.logInfo(
      `📦 Product not found by code "${req.body.code}" or name "${req.body.productName}", creating new product`
    );

    // Generate a unique code - use provided code or generate from name
    let productCode = req.body.code;
    if (!productCode && req.body.productName) {
      productCode = req.body.productName.replace(/\s+/g, '').substring(0, 10).toUpperCase();
    }

    // Check if the code already exists to avoid duplicates
    if (productCode) {
      const existingByCode = await productService.getAllProducts({ code: productCode });
      if (existingByCode.length > 0) {
        // If code exists, append timestamp to make it unique
        productCode = `${productCode}_${Date.now().toString().slice(-4)}`;
        log.logInfo(`⚠️ Code already exists, using unique code: ${productCode}`);
      }
    }

    const newProductData = {
      _id: null, // Will be auto-generated
      name: req.body.productName || productCode || 'Producto sin nombre',
      code: productCode || `PROD_${Date.now()}`,
      brand: 'Sin marca', // Default brand
      priceNet: req.body.totalValuePerDay * 0.81, // Approximate net price (without IVA)
      priceIva: req.body.totalValuePerDay * 0.19, // 19% IVA
      priceTotal: req.body.totalValuePerDay, // Total price from request
      priceWarranty: req.body.warrantyValue || 0,
      rented: true, // Mark as rented since we're creating a rent
      createdAt: new Date().toISOString(),
      updatedAt: null,
    };

    updateErrorContext(errorContext, {
      entityData: newProductData,
      creationState: { productCreated: false },
    });

    product = await productService.createProduct(newProductData);

    updateErrorContext(errorContext, {
      creationState: { productCreated: true },
    });

    log.logInfo(
      `✅ Successfully created new product with ID: ${product._id} and code: ${product.code}`
    );
  }

  updateErrorContext(errorContext, {
    step: 'rent_creation',
    entityType: 'rent',
  });

  // Create rent data without ID (let database auto-generate it)
  const rentData: Omit<Rent, 'id'> = {
    code: req.body.code,
    // Data from frontend (for compatibility)
    productName: req.body.productName,
    clientRut: req.body.clientRut,
    clientName: req.body.clientName,
    // Core rent data
    quantity: parseInt(req.body.quantity),
    totalValuePerDay: parseFloat(req.body.totalValuePerDay),
    deliveryDate: req.body.deliveryDate || '',
    paymentMethod: req.body.paymentMethod || undefined, // Opcional al crear
    warrantyValue: parseFloat(req.body.warrantyValue),
    warrantyType: req.body.warrantyType || undefined, // Tipo de garantía (cheque, efectivo, etc.)
    isFinished: req.body.isFinished || false,
    isPaid: req.body.isPaid || false,
    totalDays:
      req.body.totalDays !== undefined && req.body.totalDays !== null
        ? parseFloat(req.body.totalDays)
        : undefined,
    totalPrice: req.body.totalPrice ? parseFloat(req.body.totalPrice) : undefined,
    observations: req.body.observations || undefined,
    createdAt: new Date().toISOString(),
    // IDs from database lookups
    clientId: parseInt(client.id),
    productId: parseInt(product._id || product.id || '0'),
  };

  // Cast to Rent type (ID will be generated by database)
  const rentToCreate = { id: '', ...rentData } as Rent;

  updateErrorContext(errorContext, {
    entityData: rentData,
    creationState: { rentCreated: false },
  });

  log.logInfo(
    `📝 Creating rent with code: ${rentData.code} for client: ${client.name} (ID: ${client.id}) and product: ${product.name} (ID: ${product._id || product.id})`
  );

  const createdRent = await rentService.createRent(rentToCreate);

  updateErrorContext(errorContext, {
    creationState: { rentCreated: true },
  });

  log.logInfo(`✅ Successfully created rent with ID: ${createdRent.id}`);

  updateErrorContext(errorContext, { step: 'product_status_update' });

  // Mark product as rented after successful rent creation
  const productId = product._id || product.id;
  if (productId) {
    const updatedProductData = {
      ...product,
      rented: true,
      updatedAt: new Date().toISOString(),
    };

    await productService.updateProduct(productId, updatedProductData);
    log.logInfo(`✅ Successfully marked product ${product.code} (ID: ${productId}) as rented`);
  }

  log.logInfo(`🎉 Rent creation process completed successfully`);

  context.res = {
    status: 201,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
    body: JSON.stringify({
      success: true,
      data: createdRent,
      message: 'Rent created successfully',
    }),
  };
};

// Apply both middlewares: first authentication, then error handling
const funcCreateRent: AzureFunction = FunctionHandler(ErrorHandlerMiddleware(funcCreateRentImpl));

export = funcCreateRent;
