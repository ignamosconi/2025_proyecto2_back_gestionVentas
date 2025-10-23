import { Injectable, ParseEnumPipe, ArgumentMetadata, BadRequestException } from '@nestjs/common';

@Injectable()
export class OptionalParseEnumPipe extends ParseEnumPipe {
  async transform(value: any, metadata: ArgumentMetadata) {
    if (value === undefined || value === null || value === '') {
      // Si no hay valor, no hace validación, simplemente devuelve undefined
      return undefined;
    }
    // Si hay valor, aplica la validación normal del ParseEnumPipe
    return super.transform(value, metadata);
  }
}
