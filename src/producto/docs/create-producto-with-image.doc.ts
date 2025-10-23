// ARCHIVO: create-producto-with-image.doc.ts
export const createProductoWithImageSwagger = {
  description: 'Crear producto con imagen',
  schema: {
    type: 'object',
    properties: {
      file: {
        type: 'string',
        format: 'binary',
      },
      data: {
        type: 'string',
        description: 'JSON serializado del objeto CreateProductoDto',
        example: JSON.stringify({
          nombre: 'Camiseta',
          descripcion: 'Camiseta de algodón',
          precio: 100,
          stock: 50,
          alertaStock: 10,
          marcaId: 1,
          lineaId: 2,
        }),
      },
    },
  },
};
