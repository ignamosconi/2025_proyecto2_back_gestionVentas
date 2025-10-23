import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { UserEntity } from '../users/entities/user.entity';
import { Marca } from '../catalogo/entities/marca.entity';
import { Linea } from '../catalogo/entities/linea.entity';
import { MarcaLinea } from '../catalogo/entities/marca-linea.entity';
import { Producto } from '../producto/entities/producto.entity';
import { Proveedor } from '../proveedor/entities/proveedor.entity';
import { ProductoProveedor } from '../proveedor/entities/producto-proveedor.entity';

// Load environment variables from .env file
dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'ventas_db',
  entities: [
    UserEntity,
    Marca,
    Linea,
    MarcaLinea,
    Producto,
    Proveedor,
    ProductoProveedor,
  ],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false, // Set to false for production
  logging: process.env.NODE_ENV !== 'production',
});