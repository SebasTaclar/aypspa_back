# AYPSPA Backend - Multi-Database Support

This Azure Functions application supports **MongoDB** and **Prisma ORM** (PostgreSQL) as data sources.

## Database Options

### 1. MongoDB (Document Database)

- Flexible schema
- JSON-like documents
- Rapid prototyping

### 2. Prisma ORM (PostgreSQL - Recommended)

- **LINQ-like queries** for .NET developers
- **Type-safe** database operations
- **Auto-completion** and IntelliSense
- **Migration management**
- **Performance optimized**

## Quick Setup

### Option 1: Prisma ORM (LINQ-like, Recommended)

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
```

Edit `local.settings.json`:

```json
{
  "Values": {
    "DATABASE_TYPE": "prisma",
    "DATABASE_URL": "postgresql://username:password@localhost:5432/database"
  }
}
```

```bash
# 3. Setup database
npx prisma generate
npx prisma migrate dev --name init

# 4. Start application
npm run build
npm start
```

### Option 2: MongoDB

```json
{
  "Values": {
    "DATABASE_TYPE": "mongodb",
    "MONGO_DB_URI": "mongodb://localhost:27017",
    "MONGO_DB_DATABASE": "aypspa"
  }
}
```

## LINQ-like Queries with Prisma

Perfect for .NET developers! The Prisma adapters provide LINQ-like syntax:

```typescript
// Get all users (similar to LINQ)
const users = await userService.getAll();

// Filter by condition (like LINQ Where)
const admins = await userService.getAll({ role: 'admin' });

// Find by specific field (like LINQ FirstOrDefault)
const user = await userAdapter.findByUsername('johndoe');

// Complex filtering
const products = await productService.getAll({
  minPrice: 100,
  maxPrice: 500,
  brand: 'Dell',
});

// Aggregations (like LINQ Average)
const avgPrice = await productAdapter.getAveragePrice();
```

## Available Scripts

- `npm run build` - Compile TypeScript
- `npm run start` - Start Azure Functions host
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Sync schema to database
- `npm run db:migrate` - Create migration files
- `npm run db:studio` - Open Prisma Studio (database browser)

## Environment Variables

Configure these environment variables in `local.settings.json` for development or Azure Function App Configuration for production:

### Database Configuration

- `DATABASE_TYPE` - Database type: `"prisma"` (recommended) or `"mongodb"`
- `DATABASE_URL` - PostgreSQL connection string for Prisma (format: `postgresql://user:password@host:port/database`)
- `MONGO_DB_URI` - MongoDB connection string (only if using MongoDB)
- `MONGO_DB_DATABASE` - MongoDB database name (only if using MongoDB)

### Authentication

- `JWT_SECRET` - Secret key for JWT token signing
- `JWT_EXPIRATION` - JWT token expiration time in seconds (e.g., `"3600"` for 1 hour)

### Email Configuration (Azure Communication Services)

- `COMMUNICATION_SERVICES_CONNECTION_STRING` - Azure Communication Services connection string
- `FROM_EMAIL` - Sender email address (must be verified in Azure Communication Services)
- `BACKUP_EMAIL_RECIPIENTS` - Comma-separated list of default backup email recipients

### Backup Configuration

- `DAILY_BACKUP_SCHEDULE` - Cron expression for daily backup schedule (e.g., `"0 0 15,23 * * *"` for 3:00 PM and 11:00 PM daily)

### AWS S3 Configuration (for file storage)

- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `AWS_REGION` - AWS region (e.g., `"us-east-2"`)
- `AWS_BUCKET_NAME` - S3 bucket name

### Development

- `DEBUG` - Enable debug logging: `"true"` or `"false"`
- `NODE_ENV` - Environment: `"development"` or `"production"`

### Example Cron Expressions for DAILY_BACKUP_SCHEDULE:

- `"0 0 15,23 * * *"` - Daily at 3:00 PM and 11:00 PM
- `"0 30 14 * * *"` - Daily at 2:30 PM
- `"0 0 */6 * * *"` - Every 6 hours
- `"0 */2 * * * *"` - Every 2 minutes (testing only)

## Switching Between Databases

Simply change the `DATABASE_TYPE` environment variable:

- `DATABASE_TYPE=prisma` - Use Prisma ORM (LINQ-like)
- `DATABASE_TYPE=mongodb` - Use MongoDB

No code changes required - the factory pattern handles adapter selection automatically.

## Why Choose Prisma?

If you're coming from .NET and love LINQ, Prisma is perfect because it provides:

✅ **LINQ-like syntax** - `findMany({ where: { role: "admin" } })`  
✅ **Type safety** - Compile-time error checking  
✅ **IntelliSense** - Full auto-completion  
✅ **Migration management** - Version-controlled schema  
✅ **Performance** - Optimized queries and connection pooling  
✅ **Security** - SQL injection protection

## API Endpoints

All endpoints work with any database type:

- **Users**: `/api/funcGetUsers`, `/api/funcLogin`
- **Clients**: `/api/funcGetClients`, `/api/funcCreateClient`, `/api/funcUpdateClient`, `/api/funcDeleteClient`
- **Products**: `/api/funcGetProducts`, `/api/funcCreateProduct`

## Development Tips

1. **For .NET developers**: Use Prisma for familiar LINQ-like syntax
2. **For rapid prototyping**: Use MongoDB
3. **For production**: Prisma recommended

The factory pattern makes switching between databases seamless!

**MongoDB:**

- Make sure MongoDB is running
- The application will create collections automatically

**Prisma ORM (PostgreSQL):**

- Create a PostgreSQL database
- Run Prisma setup:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 4. Build and Start

```bash
npm run build
npm start
```

## Database Support

### MongoDB

- **Connection**: Uses MongoDB client with connection pooling
- **Collections**: `users`, `clients`, `products`
- **Features**: Document-based storage, flexible schema

### Prisma ORM (PostgreSQL)

- **Connection**: Uses Prisma Client with connection pooling
- **Tables**: `users`, `clients`, `products`
- **Features**: ACID compliance, type-safe queries, migrations, LINQ-like syntax

## Architecture

### Data Sources

Each entity has two adapter implementations:

- `EntityMongoDbAdapter` - MongoDB implementation
- `EntityPrismaAdapter` - Prisma ORM (PostgreSQL) implementation

### Factory Pattern

The factory classes automatically select the appropriate adapter based on the `DATABASE_TYPE` environment variable:

```typescript
// UserFactory.ts
if (env_config.databaseType === 'prisma') {
  userRepository = new UserPrismaAdapter();
} else {
  userRepository = new UserMongoDbAdapter(env_config.mongoDbDatabase);
}
```

### Interface Compliance

All adapters implement the same interfaces:

- `IUserDataSource`
- `IClientDataSource`
- `IProductDataSource`

## Available Scripts

- `npm run build` - Compile TypeScript
- `npm run watch` - Watch mode compilation
- `npm run start` - Start Azure Functions host
- `npx prisma generate` - Generate Prisma client
- `npx prisma migrate dev` - Run database migrations
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

## API Endpoints

All existing endpoints work with both database types:

- **Users**: `/api/funcGetUsers`, `/api/funcLogin`
- **Clients**: `/api/funcGetClients`, `/api/funcCreateClient`, `/api/funcUpdateClient`, `/api/funcDeleteClient`
- **Products**: `/api/funcGetProducts`, `/api/funcCreateProduct`

## Switching Databases

To switch between databases:

1. Change `DATABASE_TYPE` in `local.settings.json`
2. Restart the application

No code changes required - the factory pattern handles adapter selection automatically.

## Prisma Schema

The Prisma schema includes:

- Auto-incrementing primary keys
- Proper indexing for performance
- Type-safe queries
- Migration management

See `prisma/schema.prisma` for the complete schema.

## Performance Considerations

### Prisma ORM

- Connection pooling
- Prepared statements automatically
- Type-safe queries prevent SQL injection
- Query optimization

### MongoDB

- Connection pooling
- Document-based queries
- Flexible schema evolution

## Error Handling

Both adapters include:

- Connection error handling
- Automatic connection cleanup
- Proper exception propagation
- Logging for debugging

## Development Tips

1. **Testing**: Use MongoDB for rapid development, Prisma for production
2. **Migration**: The factory pattern makes database migration seamless
3. **Monitoring**: Enable debug logging with `DEBUG=true`
4. **Performance**: Prisma provides better performance and type safety

## Troubleshooting

### Prisma Connection Issues

1. Verify PostgreSQL is running
2. Check `DATABASE_URL` in `local.settings.json`
3. Ensure database exists
4. Run `npx prisma migrate dev` to apply migrations
5. Run `npx prisma generate` to update the client

### MongoDB Connection Issues

1. Verify MongoDB is running
2. Check `MONGO_DB_URI` in configuration
3. Ensure database permissions are correct

### Build Issues

```bash
npm run clean
npm install
npm run build
```

For more detailed Prisma setup instructions, see `docs/PRISMA_LINQ_GUIDE.md`.
