import { BadRequestException } from '@nestjs/common';
import { validatePasswordStrength } from './validatePasswordStrength';

describe('validatePasswordStrength', () => {
  const validEmail = 'user@example.com';
  const validFirstName = 'Carlos';
  const validLastName = 'González';

  describe('Valores Límite - Longitud', () => {
    it('debería rechazar 7 caracteres (justo debajo del límite)', () => {
      expect(() =>
        validatePasswordStrength(
          'Pass1!a',
          validEmail,
          validFirstName,
          validLastName,
        ),
      ).toThrow('La contraseña debe tener al menos 8 caracteres');
    });

    it('debería aceptar 8 caracteres (límite exacto)', () => {
      expect(() =>
        validatePasswordStrength(
          'Pass123!',
          validEmail,
          validFirstName,
          validLastName,
        ),
      ).not.toThrow();
    });

    it('debería rechazar contraseña vacía', () => {
      expect(() =>
        validatePasswordStrength('', validEmail, validFirstName, validLastName),
      ).toThrow('La contraseña debe tener al menos 8 caracteres');
    });
  });

  describe('Partición de Equivalencia - Requisitos de Caracteres', () => {
    it('debería aceptar contraseña con todos los requisitos', () => {
      expect(() =>
        validatePasswordStrength(
          'ValidPass123!',
          validEmail,
          validFirstName,
          validLastName,
        ),
      ).not.toThrow();
    });

    it('debería rechazar sin letra mayúscula', () => {
      expect(() =>
        validatePasswordStrength(
          'validpass123!',
          validEmail,
          validFirstName,
          validLastName,
        ),
      ).toThrow('La contraseña debe contener al menos una letra mayúscula');
    });

    it('debería rechazar sin letra minúscula', () => {
      expect(() =>
        validatePasswordStrength(
          'VALIDPASS123!',
          validEmail,
          validFirstName,
          validLastName,
        ),
      ).toThrow('La contraseña debe contener al menos una letra minúscula');
    });

    it('debería rechazar sin número', () => {
      expect(() =>
        validatePasswordStrength(
          'ValidPassword!',
          validEmail,
          validFirstName,
          validLastName,
        ),
      ).toThrow('La contraseña debe contener al menos un número');
    });

    it('debería rechazar sin carácter especial', () => {
      expect(() =>
        validatePasswordStrength(
          'ValidPass123',
          validEmail,
          validFirstName,
          validLastName,
        ),
      ).toThrow('La contraseña debe contener al menos un carácter especial');
    });
  });

  describe('Partición de Equivalencia - Patrones Débiles', () => {
    it('debería rechazar patrón común "password"', () => {
      expect(() =>
        validatePasswordStrength(
          'Password123!',
          validEmail,
          validFirstName,
          validLastName,
        ),
      ).toThrow('La contraseña no debe contener patrones comunes');
    });

    it('debería rechazar secuencia "1234"', () => {
      expect(() =>
        validatePasswordStrength(
          'Valid1234Pass!',
          validEmail,
          validFirstName,
          validLastName,
        ),
      ).toThrow('La contraseña no debe contener patrones comunes');
    });

    it('debería rechazar año "2024"', () => {
      expect(() =>
        validatePasswordStrength(
          'Valid2024Pass!',
          validEmail,
          validFirstName,
          validLastName,
        ),
      ).toThrow('La contraseña no debe contener patrones comunes');
    });

    it('debería rechazar "qwerty"', () => {
      expect(() =>
        validatePasswordStrength(
          'Qwerty123!Valid',
          validEmail,
          validFirstName,
          validLastName,
        ),
      ).toThrow('La contraseña no debe contener patrones comunes');
    });
  });

  describe('Partición de Equivalencia - Datos Personales', () => {
    it('debería rechazar contraseña con email', () => {
      expect(() =>
        validatePasswordStrength(
          'user@example.com123!A',
          validEmail,
          validFirstName,
          validLastName,
        ),
      ).toThrow('La contraseña no debe contener patrones comunes');
    });

    it('debería rechazar contraseña con firstName', () => {
      expect(() =>
        validatePasswordStrength(
          'Carlos123!Pass',
          validEmail,
          validFirstName,
          validLastName,
        ),
      ).toThrow('La contraseña no debe contener patrones comunes');
    });

    it('debería rechazar contraseña con lastName', () => {
      expect(() =>
        validatePasswordStrength(
          'González123!',
          validEmail,
          validFirstName,
          validLastName,
        ),
      ).toThrow('La contraseña no debe contener patrones comunes');
    });

    it('debería rechazar firstName en diferentes casos (case-insensitive)', () => {
      expect(() =>
        validatePasswordStrength(
          'cArLoS123!Strong',
          validEmail,
          validFirstName,
          validLastName,
        ),
      ).toThrow('La contraseña no debe contener patrones comunes');
    });
  });

  describe('Casos de Borde - Posición de Patrones', () => {
    it('debería detectar datos personales al inicio', () => {
      expect(() =>
        validatePasswordStrength(
          'Carlos123!xyz',
          validEmail,
          validFirstName,
          validLastName,
        ),
      ).toThrow('La contraseña no debe contener patrones comunes');
    });

    it('debería detectar datos personales al final', () => {
      expect(() =>
        validatePasswordStrength(
          'Xyz123!Carlos',
          validEmail,
          validFirstName,
          validLastName,
        ),
      ).toThrow('La contraseña no debe contener patrones comunes');
    });
  });
});
