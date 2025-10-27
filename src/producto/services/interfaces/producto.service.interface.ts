import { Producto } from '../../entities/producto.entity';
import { UpdateStockDto } from '../../dto/update-stock.dto';

export interface ProductoServiceInterface {
  // CRUD (US 7)
  findAll(): Promise<Producto[]>;
  findOne(id: number): Promise<Producto>;
  findOneActive(id: number): Promise<Producto>;
  findAllSoftDeleted(): Promise<Producto[]>;

  // La firma recibe 'any' para el cuerpo (el objeto Multer del form) y la imagen.
  enviarAlertaStock(producto: Producto): Promise<void>;
  create(data: any, file?: Express.Multer.File): Promise<Producto>;
  update(
    idProducto: number,
    data: any,
    file?: Express.Multer.File,
  ): Promise<Producto>;

  softDelete(idProducto: number): Promise<void>; // US 7: Eliminación Lógica
  restore(idProducto: number): Promise<void>; // US 7: Reversión del Soft-Delete

  updateStock(
    idProducto: number,
    updateStockDto: UpdateStockDto,
  ): Promise<Producto>;

  // Alerta de Bajo Stock (US 11)
  findLowStockProducts(): Promise<Producto[]>;
}
