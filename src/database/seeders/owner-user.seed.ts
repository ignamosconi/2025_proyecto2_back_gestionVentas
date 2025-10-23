import { DataSource } from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { UserRole } from '../../users/helpers/enum.roles';
import { AppDataSource } from '../typeorm.config';

// Load environment variables from .env file
dotenv.config();

/**
 * Seed function to create an OWNER user in the database
 */
export async function seedOwnerUser(): Promise<void> {
  // Initialize the data source
  let dataSource: DataSource;
  
  try {
    dataSource = AppDataSource;
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }
  } catch (error) {
    console.error('Error initializing the database connection', error);
    throw error;
  }

  try {
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

    const created = await userRepository.save(ownerUser);
    console.log('Usuario OWNER creado exitosamente:', { email, firstName, lastName });
    
  } catch (error) {
    console.error('Error creating OWNER user', error);
    throw error;
  } finally {
    // Close the database connection
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}