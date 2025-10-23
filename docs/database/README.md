# Database Seeders

Este directorio contiene los seeders para llenar la base de datos con datos iniciales.

## Usuario Owner

El seeder principal crea un usuario con el rol de `Owner` (Dueño). Este usuario es necesario para poder acceder a las funcionalidades administrativas del sistema.

## Requisitos

Para que el seeder funcione correctamente, debes tener las siguientes variables de entorno configuradas en tu archivo `.env`:

```
SEED_OWNER_EMAIL=tu_email@ejemplo.com
SEED_OWNER_PASSWORD=tu_contraseña_segura
SEED_OWNER_FIRST_NAME=Nombre
SEED_OWNER_LAST_NAME=Apellido
SEED_OWNER_PHONE=123456789
SEED_OWNER_ADDRESS=Dirección del Owner
```

## Ejecutando los seeders

Hay tres formas de ejecutar el seeder del usuario Owner:

### 1. Como parte de las migraciones

Al ejecutar `npm run migration:run`, la migración `1698002888888-SeedOwnerUser.ts` creará automáticamente el usuario Owner si no existe.

### 2. Usando el script de seeders

```bash
npm run seed:db
```

Este comando ejecuta todos los seeders definidos en `run-seeders.ts`.

### 3. Usando el script original

```bash
npm run seed:owner
```

Este comando ejecuta el script original `creador-usuario-owner.ts`.

## Creando nuevos seeders

Para crear nuevos seeders, sigue estos pasos:

1. Crea un archivo en el directorio `src/database/seeders/` con la lógica para insertar datos.
2. Añade una llamada a tu seeder en el archivo `run-seeders.ts`.
3. Ejecuta `npm run seed:db` para ejecutar todos los seeders.