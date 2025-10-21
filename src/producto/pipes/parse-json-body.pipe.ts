import { 
    PipeTransform, 
    Injectable, 
    ArgumentMetadata, 
    BadRequestException, 
    Type // Importación de NestJS
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

// T EXTENDS OBJECT es crucial para el tipado
@Injectable()
export class ParseJsonBodyPipe<T extends object> implements PipeTransform<any, Promise<T>> {
    
    constructor(private readonly metatype: Type<T>) { 
        if (!metatype) {
            // Este throw sólo ocurriría si no pasaste el DTO en el constructor.
            throw new Error('ParseJsonBodyPipe requires a DTO metatype.');
        }
    }

    async transform(value: any, metadata: ArgumentMetadata): Promise<T> {
        if (!value || !value.data) {
            throw new BadRequestException('El campo "data" (JSON del producto) es obligatorio en el multipart/form-data.');
        }
        
        let parsed: any;
        try {
            parsed = JSON.parse(value.data);
        } catch (error) {
            throw new BadRequestException('El campo "data" debe ser un string JSON válido.');
        }

        // 3. Transformar y Validar MANUALMENTE
        const object = plainToInstance(this.metatype, parsed);
        
        const errors = await validate(object, { 
            // CLAVE: Aplica las mismas reglas de la global pipe a tu objeto parseado
            whitelist: true, 
            forbidNonWhitelisted: true, // ¡Esto está bien aquí!
            stopAtFirstError: false 
        });

        if (errors.length > 0) {
            const errorMessages = errors.flatMap(error => Object.values(error.constraints || {}));
            throw new BadRequestException(errorMessages);
        }

        return object;
    }
}