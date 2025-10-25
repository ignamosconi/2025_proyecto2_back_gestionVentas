import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export class SeedOwnerUser1698002888888 implements MigrationInterface {
  name = 'SeedOwnerUser1698002888888';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if .env variables exist
    const email = process.env.SEED_OWNER_EMAIL;
    const password = process.env.SEED_OWNER_PASSWORD;
    const firstName = process.env.SEED_OWNER_FIRST_NAME;
    const lastName = process.env.SEED_OWNER_LAST_NAME;
    const phone = process.env.SEED_OWNER_PHONE;
    const address = process.env.SEED_OWNER_ADDRESS;

    if (!email || !password || !firstName || !lastName || !phone || !address) {
      console.warn(
        'Faltan variables de entorno necesarias para crear el usuario OWNER. Omitiendo seeder...',
      );
      return;
    }

    // Check if the owner user already exists
    const ownerExists = await queryRunner.query(
      `SELECT * FROM "users" WHERE "email" = $1 AND "role" = 'Dueño'`,
      [email],
    );

    if (ownerExists.length > 0) {
      console.log('Usuario OWNER ya existe, omitiendo la creación...');
      return;
    }

    // Hash the password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert the owner user
    await queryRunner.query(
      `INSERT INTO "users" ("firstName", "lastName", "email", "password", "phone", "address", "role") 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [firstName, lastName, email, hashedPassword, phone, address, 'Dueño'],
    );

    console.log('Usuario OWNER creado exitosamente en la migración');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const email = process.env.SEED_OWNER_EMAIL;
    if (email) {
      await queryRunner.query(
        `DELETE FROM "users" WHERE "email" = $1 AND "role" = 'Dueño'`,
        [email],
      );
      console.log('Usuario OWNER eliminado en rollback de migración');
    }
  }
}
