# 🧾 Sistema de Gestión de Ventas — Backend (NestJS + TypeORM + PostgreSQL)

## 📋 Descripción del Proyecto

Este proyecto es un **backend desarrollado con NestJS** que implementa un sistema completo de **gestión de ventas, productos, compras y usuarios**.  
Permite administrar el catálogo (productos, marcas, líneas), gestionar roles y permisos, registrar ventas y compras, y visualizar métricas de rendimiento.

El sistema está diseñado para ser **modular, seguro y escalable**, integrando autenticación JWT, gestión de sesiones, roles, auditoría y seeds automáticos.

---

## 🚀 Tecnologías principales

- **NestJS** (Framework principal)
- **TypeORM** (ORM para base de datos)
- **PostgreSQL** (Base de datos relacional)
- **JWT** (Autenticación basada en tokens)
- **bcrypt** (Hash de contraseñas)
- **dotenv** (Manejo de variables de entorno)
- **TypeScript**

---

## ⚙️ Configuración del Proyecto

### 1️⃣ Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd <nombre-del-proyecto>
```

### 2️⃣ Instalar dependencias

```bash
npm install
```

### 3️⃣ Configurar variables de entorno

Crear un archivo `.env` en la raíz del proyecto con el siguiente formato:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_password
DB_NAME=ventas_db

# JWT
JWT_SECRET=supersecreto
JWT_EXPIRES_IN=1d

# Seed Owner User
SEED_OWNER_EMAIL=admin@empresa.com
SEED_OWNER_PASSWORD=123456
SEED_OWNER_FIRST_NAME=Admin
SEED_OWNER_LAST_NAME=Principal
```

---

## 🗄️ Migraciones de Base de Datos

Ejecutar las migraciones para crear las tablas necesarias:

```bash
npm run typeorm:migration:run
```

Si necesitás revertir una migración:

```bash
npm run typeorm:migration:revert
```

---

## 🌱 Ejecución de Seeders

El proyecto incluye dos seeders principales:

| Seeder | Descripción |
|:--|:--|
| **seedCatalogoProductos** | Carga inicial de líneas, marcas, productos, proveedores y sus relaciones. |
| **seedOwnerUser** | Crea un usuario OWNER (dueño) usando las variables del `.env`. |

Ejecutar ambos seeders:

```bash
npm run seed:owner
npm run seed:catalogo
```

📌 **Asegurate de que la base de datos esté creada y las migraciones ejecutadas antes de correr los seeders.**

---

## 🧩 Scripts disponibles (`package.json`)

```json
"scripts": {
  "start": "nest start",
  "start:dev": "nest start --watch",
  "build": "nest build",
  "typeorm:migration:run": "npx typeorm-ts-node-commonjs migration:run -d src/database/data-source.ts",
  "typeorm:migration:revert": "npx typeorm-ts-node-commonjs migration:revert -d src/database/data-source.ts",
  "seed:owner": "ts-node src/database/seeders/seedOwnerUser.ts",
  "seed:catalogo": "ts-node src/database/seeders/seedCatalogoProductos.ts"
}
```

---

## 🧩 Ejecución del Proyecto

Levantar el servidor en modo desarrollo:

```bash
npm run start:dev
```

El servidor estará disponible en:  
👉 **http://localhost:3000**

---

## 🧑‍💼 Roles del Sistema

| Rol | Permisos principales |
|:--|:--|
| **Dueño (OWNER)** | Gestión completa del sistema, usuarios, roles, métricas |
| **Empleado (EMPLOYEE)** | Registro de ventas, gestión de productos |

---

## 📚 Funcionalidades Principales (User Stories)

### 👥 Gestión de Usuarios y Seguridad

- **US 1:** Creación de cuentas por el Dueño  
- **US 1.1:** Inicio de sesión con validación JWT  
- **US 2:** Actualización de perfil y cambio de contraseña  
- **US 3:** Recuperación de contraseña vía email  
- **US 4:** Seguridad de sesión (tokens seguros, HTTPS)  
- **US 5:** Gestión de roles y permisos  
- **US 6:** Registro de auditoría de sesiones  

### 🛍️ Gestión de Catálogo

- **US 7:** CRUD de productos con validaciones y stock  
- **US 8:** CRUD de marcas (sin duplicados ni eliminaciones si hay productos asociados)  
- **US 9:** CRUD de líneas de producto  
- **US 10:** Creación rápida de líneas desde el formulario de productos  

### 📦 Compras, Ventas y Stock

- **US 11:** Alerta automática de bajo stock (<10 unidades)  
- **US 12:** Asociación de productos con proveedores y códigos únicos  
- **US 13:** Dashboard de métricas (solo para Dueños)  
- **US 14:** Registro y actualización de ventas con impacto en stock  
- **US 15:** Registro y actualización de compras con impacto en stock  

---

## 📊 Seeds incluidos

| Seeder | Descripción |
|:--|:--|
| **seedOwnerUser()** | Crea el usuario Dueño inicial |
| **seedCatalogoProductos()** | Crea líneas, marcas, relaciones, proveedores, productos y sus vínculos |

---

## 🧪 Comandos útiles

| Acción | Comando |
|:--|:--|
| Instalar dependencias | `npm install` |
| Ejecutar migraciones | `npm run typeorm:migration:run` |
| Ejecutar seeders | `npm run seed:owner` y `npm run seed:catalogo` |
| Levantar servidor dev | `npm run start:dev` |
| Revertir migraciones | `npm run typeorm:migration:revert` |
| Compilar proyecto | `npm run build` |

---

## 🧰 Buenas prácticas implementadas

- Arquitectura modular basada en dominios  
- DTOs y validaciones con `class-validator`  
- Repositorios inyectados mediante tokens  
- Hash de contraseñas con `bcrypt`  
- Uso de `dotenv` para configuración  
- Relaciones explícitas entre entidades  
- Control de errores con `BadRequestException` y `NotFoundException`  

---

## ✉️ Integrantes del grupo

Liendo Alejo, Lucarelli Bruno, Magni Gastón, Mosconi Ignacio, Terreno Valentino
