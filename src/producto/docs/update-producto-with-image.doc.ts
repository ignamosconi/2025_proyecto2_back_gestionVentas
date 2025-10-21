export const updateProductoWithImageSwagger = {
  description: 'Actualizar producto con imagen (opcional)',
  required: true,
  schema: {
    type: 'object',
    properties: {
      file: {
        type: 'string',
        format: 'binary',
        description: 'Nueva imagen del producto (opcional)',
      },
      data: {
        type: 'string',
        description: 'JSON serializado del objeto UpdateProductoDto',
        example: JSON.stringify({
          nombre: 'Camiseta actualizada',
          precio: 120,
          stock: 60,
        }, null, 2),
      },
    },
  },
};