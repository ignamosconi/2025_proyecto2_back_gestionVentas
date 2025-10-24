import { DataSource } from 'typeorm';
import { Venta } from '../../venta/entities/venta.entity';
import { DetalleVenta } from '../../venta/entities/detalle-venta.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { Producto } from '../../producto/entities/producto.entity';
import { MetodoPago } from '../../venta/enums/metodo-pago.enum';
import { AppDataSource } from '../typeorm.config';

/**
 * Seed function to create sales (ventas) with dates from different months
 */
export async function seedVentas(): Promise<void> {
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
    const ventaRepository = dataSource.getRepository(Venta);
    const detalleVentaRepository = dataSource.getRepository(DetalleVenta);
    const userRepository = dataSource.getRepository(UserEntity);
    const productoRepository = dataSource.getRepository(Producto);

    console.log('💰 Iniciando seed de ventas...');

    // Obtener usuarios existentes
    const users = await userRepository.find();
    if (users.length === 0) {
      console.log('⚠️  No hay usuarios en la base de datos. Ejecuta primero el seeder de usuarios.');
      return;
    }

    // Obtener productos existentes
    const productos = await productoRepository.find();
    if (productos.length === 0) {
      console.log('⚠️  No hay productos en la base de datos. Ejecuta primero el seeder de productos.');
      return;
    }

    console.log(`📊 Encontrados: ${users.length} usuarios y ${productos.length} productos`);

    // Helper function to get a random item from an array
    const randomItem = <T>(array: T[]): T => array[Math.floor(Math.random() * array.length)];

    // Helper function to get random items from an array
    const randomItems = <T>(array: T[], count: number): T[] => {
      const shuffled = [...array].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, Math.min(count, array.length));
    };

    // Helper function to create a date in a specific month
    const createDate = (monthsAgo: number, day?: number): Date => {
      const date = new Date();
      date.setMonth(date.getMonth() - monthsAgo);
      if (day) {
        date.setDate(day);
      } else {
        // Random day of the month (1-28 to avoid issues with February)
        date.setDate(Math.floor(Math.random() * 28) + 1);
      }
      // Random hour between 9 AM and 8 PM
      date.setHours(Math.floor(Math.random() * 12) + 9);
      // Random minutes
      date.setMinutes(Math.floor(Math.random() * 60));
      date.setSeconds(0);
      date.setMilliseconds(0);
      return date;
    };

    // Array of payment methods
    const metodosPago = Object.values(MetodoPago);

    // Configuración de ventas por mes (últimos 6 meses)
    const ventasPorMes = [
      { mes: 0, cantidad: 15 }, // Mes actual
      { mes: 1, cantidad: 20 }, // Hace 1 mes
      { mes: 2, cantidad: 18 }, // Hace 2 meses
      { mes: 3, cantidad: 22 }, // Hace 3 meses
      { mes: 4, cantidad: 16 }, // Hace 4 meses
      { mes: 5, cantidad: 19 }, // Hace 5 meses
    ];

    let totalVentas = 0;
    let totalMontoVentas = 0;

    // Crear ventas para cada mes
    for (const config of ventasPorMes) {
      console.log(`📅 Creando ${config.cantidad} ventas para hace ${config.mes} mes(es)...`);

      for (let i = 0; i < config.cantidad; i++) {
        // Seleccionar un usuario aleatorio
        const usuario = randomItem(users);

        // Seleccionar método de pago aleatorio
        const metodoPago = randomItem(metodosPago);

        // Seleccionar entre 1 y 5 productos aleatorios
        const cantidadProductos = Math.floor(Math.random() * 5) + 1;
        const productosVenta = randomItems(productos, cantidadProductos);

        // Crear detalles de venta
        const detalles: DetalleVenta[] = [];
        let total = 0;

        for (const producto of productosVenta) {
          // Cantidad aleatoria entre 1 y 5
          const cantidad = Math.floor(Math.random() * 5) + 1;
          const precioUnitario = Number(producto.precio);
          const subtotal = precioUnitario * cantidad;

          const detalle = detalleVentaRepository.create({
            idProducto: producto.idProducto,
            producto: producto,
            cantidad: cantidad,
            precioUnitario: precioUnitario,
            subtotal: subtotal,
          });

          detalles.push(detalle);
          total += subtotal;
        }

        // Crear la venta
        const venta = ventaRepository.create({
          usuario: usuario,
          metodoPago: metodoPago,
          total: total,
          detalles: detalles,
          fechaCreacion: createDate(config.mes),
        });

        // Guardar la venta (cascade guardará los detalles)
        await ventaRepository.save(venta);

        totalVentas++;
        totalMontoVentas += total;

        console.log(`  ✅ Venta #${totalVentas} creada: $${total.toFixed(2)} - ${usuario.firstName} ${usuario.lastName} - ${metodoPago}`);
      }
    }

    // Crear algunas ventas adicionales con fechas específicas para testing
    console.log('📅 Creando ventas adicionales con fechas específicas...');

    const ventasEspecificas = [
      // Primera semana del mes actual
      { dia: 1, mes: 0, usuario: users[0], productos: [productos[0]], cantidades: [2] },
      { dia: 3, mes: 0, usuario: users[0], productos: [productos[1]], cantidades: [1] },
      { dia: 5, mes: 0, usuario: users[0], productos: [productos[2], productos[3]], cantidades: [1, 3] },
      
      // Última semana del mes anterior
      { dia: 25, mes: 1, usuario: users[0], productos: [productos[4]], cantidades: [2] },
      { dia: 28, mes: 1, usuario: users[0], productos: [productos[5], productos[6]], cantidades: [1, 1] },
      
      // Mitad del mes hace 2 meses
      { dia: 15, mes: 2, usuario: users[0], productos: [productos[0], productos[2], productos[4]], cantidades: [1, 2, 1] },
    ];

    for (const ventaData of ventasEspecificas) {
      const metodoPago = randomItem(metodosPago);
      const detalles: DetalleVenta[] = [];
      let total = 0;

      for (let i = 0; i < ventaData.productos.length; i++) {
        const producto = ventaData.productos[i];
        const cantidad = ventaData.cantidades[i];
        const precioUnitario = Number(producto.precio);
        const subtotal = precioUnitario * cantidad;

        const detalle = detalleVentaRepository.create({
          idProducto: producto.idProducto,
          producto: producto,
          cantidad: cantidad,
          precioUnitario: precioUnitario,
          subtotal: subtotal,
        });

        detalles.push(detalle);
        total += subtotal;
      }

      const venta = ventaRepository.create({
        usuario: ventaData.usuario,
        metodoPago: metodoPago,
        total: total,
        detalles: detalles,
        fechaCreacion: createDate(ventaData.mes, ventaData.dia),
      });

      await ventaRepository.save(venta);
      totalVentas++;
      totalMontoVentas += total;

      console.log(`  ✅ Venta específica creada: Día ${ventaData.dia}, hace ${ventaData.mes} mes(es)`);
    }

    console.log('✅ Seed de ventas completado exitosamente');
    console.log(`
📊 Resumen:
   - Total de ventas creadas: ${totalVentas}
   - Monto total de ventas: $${totalMontoVentas.toFixed(2)}
   - Promedio por venta: $${(totalMontoVentas / totalVentas).toFixed(2)}
   - Rango de fechas: Últimos 6 meses
    `);
    
  } catch (error) {
    console.error('❌ Error creating sales data', error);
    throw error;
  } finally {
    // Close the database connection
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}
