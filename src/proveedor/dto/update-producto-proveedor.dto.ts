import { PartialType } from "@nestjs/swagger";
import { CreateProductoProveedorDto } from "./create-producto-proveedor.dto";

export class UpdateProductoProveedorDto extends PartialType(CreateProductoProveedorDto) {}