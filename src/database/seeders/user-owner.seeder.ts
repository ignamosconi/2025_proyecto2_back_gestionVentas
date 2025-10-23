import { DataSource } from 'typeorm';

// Local Seeder interface to avoid depending on external 'typeorm-extension' type declarations
interface Seeder {
  run(dataSource: DataSource): Promise<void>;
}
import { UserEntity } from '../../users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { UserRole } from '../../users/helpers/enum.roles';

// Load environment variables from .env file
dotenv.config();

export default class UserOwnerSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const userRepository = dataSource.getRepository(UserEntity);

    // Check if owner already exists
    const existingOwner = await userRepository.findOne({
      where: { 
        email: process.env.SEED_OWNER_EMAIL,
        role: UserRole.OWNER 
      }
    });

    if (existingOwner) {
      console.log('Usuario OWNER ya existe, omitiendo la creación...');
      return;
    }
    
    // Validate environment variables
    const email = process.env.SEED_OWNER_EMAIL;
    const password = process.env.SEED_OWNER_PASSWORD;
    const firstName = process.env.SEED_OWNER_FIRST_NAME;
    const lastName = process.env.SEED_OWNER_LAST_NAME;
    const phone = process.env.SEED_OWNER_PHONE;
    const address = process.env.SEED_OWNER_ADDRESS;

    if (!email || !password || !firstName || !lastName || !phone || !address) {
      console.error('Faltan variables de entorno necesarias para crear el usuario OWNER');
      throw new Error('Faltan variables de entorno necesarias para crear el usuario OWNER');
    }

    // Hash the password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create owner user
    const ownerUser = userRepository.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      address,
      role: UserRole.OWNER,
    });

    await userRepository.save(ownerUser);
    console.log('Usuario OWNER creado exitosamente:', { email, firstName, lastName });
  }
}