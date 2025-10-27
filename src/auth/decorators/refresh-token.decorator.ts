import {
  createParamDecorator,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';

/*
  En el auth.controller, en el endpoint /tokens, tenemos que extraer un token del header Authorization
  Este endpoint debe ser público, por lo que no podemos utilizar AuthGuard para extraer el encabezado

  Como el token viene en el header, Nest no nos va a dejar utilizar un PIPE para trabajarlo, ya que
  no permite pasar una instancia de Pipe al decorador @Header.

  Para evitar colocar la lógica de la extracción del token en el service (lo cual no es escalable),
  definimos un decorador personalizado para hacer esto (virtualmente tiene la misma funcionalidad
  que la pipe, pero no la utilizamos por la razón que listamos en el párrafo 2).
*/

// Export the factory function for testing
export const refreshTokenFactory = (data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest();
  const authHeader = request.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new BadRequestException('El header Authorization debe tener el formato Bearer [token]');
  }

  // Extract everything after "Bearer " to support tokens with spaces
  return authHeader.substring('Bearer '.length);
};

export const RefreshToken = createParamDecorator(refreshTokenFactory);
