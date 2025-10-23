import { seedOwnerUser } from './owner-user.seed';

/**
 * Main function to run all seeders
 */
async function runSeeders() {
  console.log('======= Running Seeders =======');
  
  try {
    // Run the owner user seeder
    await seedOwnerUser();
    console.log('✅ Owner user seeder completed successfully');
  } catch (error) {
    console.error('❌ Error running seeders:', error);
    process.exit(1);
  }
  
  console.log('======= All Seeders Completed =======');
  process.exit(0);
}

// Run the seeders
runSeeders();