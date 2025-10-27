# TypeORM Migrations Guide

This document provides instructions on how to use the TypeORM migrations in this project.

## Migration Commands

The following commands are available for managing migrations:

```bash
# Generate a migration from entity changes
npm run migration:generate -- src/database/migrations/MigrationName

# Create an empty migration file
npm run migration:create -- src/database/migrations/MigrationName

# Run all pending migrations
npm run migration:run

# Revert the most recent migration
npm run migration:revert
```

## Running the Created Migrations

To run the migrations that have been created, follow these steps:

1. Make sure your database is running and properly configured in your `.env` file
2. Run the following command:

```bash
npm run migration:run
```

This will execute all migrations in sequence based on their timestamp.

## Migration Order

The migrations will run in the following order:

1. Users table (1698001111111)
2. Marca table (1698001222222)
3. Linea table (1698001333333)
4. MarcaLinea junction table (1698001444444)
5. Proveedor table (1698001555555)
6. Producto table (1698001666666)
7. ProductoProveedor junction table (1698001777777)

## Reverting Migrations

If you need to revert migrations, use:

```bash
npm run migration:revert
```

This will undo migrations in reverse order, one at a time.

## Future Migrations

To create new migrations in the future, you can use:

```bash
# Create an empty migration file
npm run migration:create -- src/database/migrations/NewMigrationName

# Or generate from entity changes
npm run migration:generate -- src/database/migrations/NewMigrationName
```

Be careful when modifying existing tables, as you may need to handle data migration within your migration files.