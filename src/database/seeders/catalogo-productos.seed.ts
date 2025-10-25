import { DataSource } from 'typeorm';
import { Linea } from '../../catalogo/entities/linea.entity';
import { Marca } from '../../catalogo/entities/marca.entity';
import { MarcaLinea } from '../../catalogo/entities/marca-linea.entity';
import { Proveedor } from '../../proveedor/entities/proveedor.entity';
import { Producto } from '../../producto/entities/producto.entity';
import { ProductoProveedor } from '../../proveedor/entities/producto-proveedor.entity';
import { AppDataSource } from '../typeorm.config';

/**
 * Seed function to create catalog data (Lineas, Marcas, Proveedores, Productos)
 * and their relationships
 */
export async function seedCatalogoProductos(): Promise<void> {
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
    const lineaRepository = dataSource.getRepository(Linea);
    const marcaRepository = dataSource.getRepository(Marca);
    const marcaLineaRepository = dataSource.getRepository(MarcaLinea);
    const proveedorRepository = dataSource.getRepository(Proveedor);
    const productoRepository = dataSource.getRepository(Producto);
    const productoProveedorRepository =
      dataSource.getRepository(ProductoProveedor);

    console.log('📦 Iniciando seed de catálogo y productos...');

    // === 1. CREAR LÍNEAS ===
    console.log('📝 Creando líneas...');
    const lineasData = [
      { nombre: 'Electrónica' },
      { nombre: 'Hogar y Cocina' },
      { nombre: 'Deportes' },
      { nombre: 'Oficina' },
      { nombre: 'Textil' },
    ];

    const lineas: Linea[] = [];
    for (const lineaData of lineasData) {
      const existingLinea = await lineaRepository.findOne({
        where: { nombre: lineaData.nombre },
      });

      if (existingLinea) {
        lineas.push(existingLinea);
        console.log(`  ⏭️  Línea "${lineaData.nombre}" ya existe`);
      } else {
        const linea = lineaRepository.create(lineaData);
        const savedLinea = await lineaRepository.save(linea);
        lineas.push(savedLinea);
        console.log(`  ✅ Línea creada: ${lineaData.nombre}`);
      }
    }

    // === 2. CREAR MARCAS ===
    console.log('📝 Creando marcas...');
    const marcasData = [
      {
        nombre: 'Samsung',
        descripcion: 'Tecnología de vanguardia en electrónica',
      },
      { nombre: 'LG', descripcion: 'Innovación en electrodomésticos' },
      {
        nombre: 'Sony',
        descripcion: 'Entretenimiento y electrónica de alta calidad',
      },
      {
        nombre: 'Nike',
        descripcion: 'Equipamiento deportivo de alto rendimiento',
      },
      { nombre: 'Adidas', descripcion: 'Ropa y calzado deportivo' },
      { nombre: 'Philips', descripcion: 'Iluminación y electrodomésticos' },
      { nombre: 'HP', descripcion: 'Computadoras y equipos de oficina' },
      { nombre: 'Canon', descripcion: 'Impresoras y cámaras' },
    ];

    const marcas: Marca[] = [];
    for (const marcaData of marcasData) {
      const existingMarca = await marcaRepository.findOne({
        where: { nombre: marcaData.nombre },
      });

      if (existingMarca) {
        marcas.push(existingMarca);
        console.log(`  ⏭️  Marca "${marcaData.nombre}" ya existe`);
      } else {
        const marca = marcaRepository.create(marcaData);
        const savedMarca = await marcaRepository.save(marca);
        marcas.push(savedMarca);
        console.log(`  ✅ Marca creada: ${marcaData.nombre}`);
      }
    }

    // === 3. CREAR RELACIONES MARCA-LÍNEA ===
    console.log('🔗 Creando relaciones marca-línea...');
    const marcaLineaRelations = [
      // Electrónica
      { marcaNombre: 'Samsung', lineaNombre: 'Electrónica' },
      { marcaNombre: 'LG', lineaNombre: 'Electrónica' },
      { marcaNombre: 'Sony', lineaNombre: 'Electrónica' },
      { marcaNombre: 'Philips', lineaNombre: 'Electrónica' },
      { marcaNombre: 'HP', lineaNombre: 'Electrónica' },
      { marcaNombre: 'Canon', lineaNombre: 'Electrónica' },

      // Hogar y Cocina
      { marcaNombre: 'Samsung', lineaNombre: 'Hogar y Cocina' },
      { marcaNombre: 'LG', lineaNombre: 'Hogar y Cocina' },
      { marcaNombre: 'Philips', lineaNombre: 'Hogar y Cocina' },

      // Deportes
      { marcaNombre: 'Nike', lineaNombre: 'Deportes' },
      { marcaNombre: 'Adidas', lineaNombre: 'Deportes' },

      // Oficina
      { marcaNombre: 'HP', lineaNombre: 'Oficina' },
      { marcaNombre: 'Canon', lineaNombre: 'Oficina' },
      { marcaNombre: 'Samsung', lineaNombre: 'Oficina' },

      // Textil
      { marcaNombre: 'Nike', lineaNombre: 'Textil' },
      { marcaNombre: 'Adidas', lineaNombre: 'Textil' },
    ];

    for (const relation of marcaLineaRelations) {
      const marca = marcas.find((m) => m.nombre === relation.marcaNombre);
      const linea = lineas.find((l) => l.nombre === relation.lineaNombre);

      if (marca && linea) {
        const existingRelation = await marcaLineaRepository.findOne({
          where: { marcaId: marca.id, lineaId: linea.id },
        });

        if (!existingRelation) {
          const marcaLinea = marcaLineaRepository.create({
            marcaId: marca.id,
            lineaId: linea.id,
          });
          await marcaLineaRepository.save(marcaLinea);
          console.log(
            `  ✅ Relación creada: ${marca.nombre} - ${linea.nombre}`,
          );
        } else {
          console.log(
            `  ⏭️  Relación ${marca.nombre} - ${linea.nombre} ya existe`,
          );
        }
      }
    }

    // === 4. CREAR PROVEEDORES ===
    console.log('📝 Creando proveedores...');
    const proveedoresData = [
      {
        nombre: 'Distribuidora Tech SA',
        direccion: 'Av. Tecnología 1234, CABA',
        telefono: '+54 11 4567-8901',
      },
      {
        nombre: 'Importadora Global',
        direccion: 'Av. Libertador 5678, Buenos Aires',
        telefono: '+54 11 4567-8902',
      },
      {
        nombre: 'Mayorista Deportivo',
        direccion: 'Calle Deporte 910, Rosario',
        telefono: '+54 341 456-7890',
      },
      {
        nombre: 'Proveedor Express',
        direccion: 'Av. Comercio 1122, Córdoba',
        telefono: '+54 351 456-7891',
      },
      {
        nombre: 'Electrónica del Sur',
        direccion: 'Calle Principal 3344, Mendoza',
        telefono: '+54 261 456-7892',
      },
    ];

    const proveedores: Proveedor[] = [];
    for (const proveedorData of proveedoresData) {
      const existingProveedor = await proveedorRepository.findOne({
        where: { nombre: proveedorData.nombre },
      });

      if (existingProveedor) {
        proveedores.push(existingProveedor);
        console.log(`  ⏭️  Proveedor "${proveedorData.nombre}" ya existe`);
      } else {
        const proveedor = proveedorRepository.create(proveedorData);
        const savedProveedor = await proveedorRepository.save(proveedor);
        proveedores.push(savedProveedor);
        console.log(`  ✅ Proveedor creado: ${proveedorData.nombre}`);
      }
    }

    // === 5. CREAR PRODUCTOS ===
    console.log('📝 Creando productos...');

    // Helper para encontrar marca y línea
    const getMarca = (nombre: string) =>
      marcas.find((m) => m.nombre === nombre);
    const getLinea = (nombre: string) =>
      lineas.find((l) => l.nombre === nombre);

    const productosData = [
      // Electrónica
      {
        nombre: 'Smart TV Samsung 55"',
        descripcion: 'Televisor inteligente 4K UHD con HDR',
        precio: 899999.99,
        stock: 15,
        alertaStock: 5,
        marcaNombre: 'Samsung',
        lineaNombre: 'Electrónica',
        foto: null,
      },
      {
        nombre: 'Notebook HP Pavilion',
        descripcion: 'Intel Core i5, 8GB RAM, 256GB SSD',
        precio: 1299999.99,
        stock: 10,
        alertaStock: 3,
        marcaNombre: 'HP',
        lineaNombre: 'Electrónica',
        foto: null,
      },
      {
        nombre: 'Auriculares Sony WH-1000XM5',
        descripcion: 'Auriculares con cancelación de ruido activa',
        precio: 549999.99,
        stock: 25,
        alertaStock: 8,
        marcaNombre: 'Sony',
        lineaNombre: 'Electrónica',
        foto: null,
      },

      // Hogar y Cocina
      {
        nombre: 'Refrigerador LG InstaView',
        descripcion: 'Refrigerador inteligente 600L con puerta InstaView',
        precio: 1899999.99,
        stock: 5,
        alertaStock: 2,
        marcaNombre: 'LG',
        lineaNombre: 'Hogar y Cocina',
        foto: null,
      },
      {
        nombre: 'Microondas Samsung 28L',
        descripcion: 'Microondas con grill y función descongelado',
        precio: 189999.99,
        stock: 20,
        alertaStock: 5,
        marcaNombre: 'Samsung',
        lineaNombre: 'Hogar y Cocina',
        foto: null,
      },
      {
        nombre: 'Licuadora Philips 700W',
        descripcion: 'Licuadora con jarra de vidrio 2L',
        precio: 89999.99,
        stock: 30,
        alertaStock: 10,
        marcaNombre: 'Philips',
        lineaNombre: 'Hogar y Cocina',
        foto: null,
      },

      // Deportes
      {
        nombre: 'Zapatillas Nike Air Max',
        descripcion: 'Zapatillas deportivas para running',
        precio: 149999.99,
        stock: 50,
        alertaStock: 15,
        marcaNombre: 'Nike',
        lineaNombre: 'Deportes',
        foto: null,
      },
      {
        nombre: 'Pelota de Fútbol Adidas',
        descripcion: 'Pelota oficial tamaño 5',
        precio: 29999.99,
        stock: 100,
        alertaStock: 20,
        marcaNombre: 'Adidas',
        lineaNombre: 'Deportes',
        foto: null,
      },
      {
        nombre: 'Botella Deportiva Nike 1L',
        descripcion: 'Botella con sistema antigoteo',
        precio: 14999.99,
        stock: 75,
        alertaStock: 20,
        marcaNombre: 'Nike',
        lineaNombre: 'Deportes',
        foto: null,
      },

      // Oficina
      {
        nombre: 'Impresora HP LaserJet Pro',
        descripcion: 'Impresora láser monocromática',
        precio: 349999.99,
        stock: 12,
        alertaStock: 4,
        marcaNombre: 'HP',
        lineaNombre: 'Oficina',
        foto: null,
      },
      {
        nombre: 'Monitor Samsung 27" 4K',
        descripcion: 'Monitor profesional con panel IPS',
        precio: 599999.99,
        stock: 18,
        alertaStock: 5,
        marcaNombre: 'Samsung',
        lineaNombre: 'Oficina',
        foto: null,
      },
      {
        nombre: 'Escáner Canon CanoScan',
        descripcion: 'Escáner de documentos de alta velocidad',
        precio: 249999.99,
        stock: 8,
        alertaStock: 3,
        marcaNombre: 'Canon',
        lineaNombre: 'Oficina',
        foto: null,
      },

      // Textil
      {
        nombre: 'Remera Deportiva Nike Dri-FIT',
        descripcion: 'Remera con tecnología de secado rápido',
        precio: 24999.99,
        stock: 120,
        alertaStock: 30,
        marcaNombre: 'Nike',
        lineaNombre: 'Textil',
        foto: null,
      },
      {
        nombre: 'Pantalón Adidas Training',
        descripcion: 'Pantalón deportivo con tecnología Climalite',
        precio: 39999.99,
        stock: 80,
        alertaStock: 20,
        marcaNombre: 'Adidas',
        lineaNombre: 'Textil',
        foto: null,
      },
      {
        nombre: 'Medias Deportivas Nike 3 Pack',
        descripcion: 'Pack de 3 pares de medias deportivas',
        precio: 12999.99,
        stock: 150,
        alertaStock: 40,
        marcaNombre: 'Nike',
        lineaNombre: 'Textil',
        foto: null,
      },
    ];

    const productos: Producto[] = [];
    for (const productoData of productosData) {
      const marca = getMarca(productoData.marcaNombre);
      const linea = getLinea(productoData.lineaNombre);

      if (!marca || !linea) {
        console.log(
          `  ⚠️  No se encontró marca o línea para ${productoData.nombre}`,
        );
        continue;
      }

      const existingProducto = await productoRepository.findOne({
        where: { nombre: productoData.nombre },
      });

      if (existingProducto) {
        productos.push(existingProducto);
        console.log(`  ⏭️  Producto "${productoData.nombre}" ya existe`);
      } else {
        const producto = productoRepository.create({
          nombre: productoData.nombre,
          descripcion: productoData.descripcion,
          precio: productoData.precio,
          stock: productoData.stock,
          alertaStock: productoData.alertaStock,
          foto: productoData.foto || undefined,
          idMarca: marca.id,
          idLinea: linea.id,
        });
        const savedProducto = await productoRepository.save(producto);
        productos.push(savedProducto);
        console.log(`  ✅ Producto creado: ${productoData.nombre}`);
      }
    }

    // === 6. CREAR RELACIONES PRODUCTO-PROVEEDOR ===
    console.log('🔗 Creando relaciones producto-proveedor...');

    // Helper para encontrar productos y proveedores
    const getProducto = (nombre: string) =>
      productos.find((p) => p.nombre === nombre);
    const getProveedor = (nombre: string) =>
      proveedores.find((p) => p.nombre === nombre);

    const productoProveedorRelations = [
      // Distribuidora Tech SA - Electrónica
      {
        productoNombre: 'Smart TV Samsung 55"',
        proveedorNombre: 'Distribuidora Tech SA',
        codigoProveedor: 'TECH-SAM-TV55-001',
      },
      {
        productoNombre: 'Notebook HP Pavilion',
        proveedorNombre: 'Distribuidora Tech SA',
        codigoProveedor: 'TECH-HP-NB-001',
      },
      {
        productoNombre: 'Monitor Samsung 27" 4K',
        proveedorNombre: 'Distribuidora Tech SA',
        codigoProveedor: 'TECH-SAM-MON27-001',
      },

      // Importadora Global - Múltiples
      {
        productoNombre: 'Auriculares Sony WH-1000XM5',
        proveedorNombre: 'Importadora Global',
        codigoProveedor: 'IMP-SONY-AUR-001',
      },
      {
        productoNombre: 'Refrigerador LG InstaView',
        proveedorNombre: 'Importadora Global',
        codigoProveedor: 'IMP-LG-REF-001',
      },
      {
        productoNombre: 'Microondas Samsung 28L',
        proveedorNombre: 'Importadora Global',
        codigoProveedor: 'IMP-SAM-MIC-001',
      },
      {
        productoNombre: 'Smart TV Samsung 55"',
        proveedorNombre: 'Importadora Global',
        codigoProveedor: 'IMP-SAM-TV-002',
      },

      // Mayorista Deportivo - Deportes y Textil
      {
        productoNombre: 'Zapatillas Nike Air Max',
        proveedorNombre: 'Mayorista Deportivo',
        codigoProveedor: 'DEP-NIKE-ZAP-001',
      },
      {
        productoNombre: 'Pelota de Fútbol Adidas',
        proveedorNombre: 'Mayorista Deportivo',
        codigoProveedor: 'DEP-ADI-PEL-001',
      },
      {
        productoNombre: 'Botella Deportiva Nike 1L',
        proveedorNombre: 'Mayorista Deportivo',
        codigoProveedor: 'DEP-NIKE-BOT-001',
      },
      {
        productoNombre: 'Remera Deportiva Nike Dri-FIT',
        proveedorNombre: 'Mayorista Deportivo',
        codigoProveedor: 'DEP-NIKE-REM-001',
      },
      {
        productoNombre: 'Pantalón Adidas Training',
        proveedorNombre: 'Mayorista Deportivo',
        codigoProveedor: 'DEP-ADI-PAN-001',
      },
      {
        productoNombre: 'Medias Deportivas Nike 3 Pack',
        proveedorNombre: 'Mayorista Deportivo',
        codigoProveedor: 'DEP-NIKE-MED-001',
      },

      // Proveedor Express - Oficina y Hogar
      {
        productoNombre: 'Impresora HP LaserJet Pro',
        proveedorNombre: 'Proveedor Express',
        codigoProveedor: 'EXP-HP-IMP-001',
      },
      {
        productoNombre: 'Escáner Canon CanoScan',
        proveedorNombre: 'Proveedor Express',
        codigoProveedor: 'EXP-CAN-ESC-001',
      },
      {
        productoNombre: 'Licuadora Philips 700W',
        proveedorNombre: 'Proveedor Express',
        codigoProveedor: 'EXP-PHI-LIC-001',
      },

      // Electrónica del Sur - Electrónica y Hogar
      {
        productoNombre: 'Notebook HP Pavilion',
        proveedorNombre: 'Electrónica del Sur',
        codigoProveedor: 'SUR-HP-NB-002',
      },
      {
        productoNombre: 'Auriculares Sony WH-1000XM5',
        proveedorNombre: 'Electrónica del Sur',
        codigoProveedor: 'SUR-SONY-AUR-002',
      },
      {
        productoNombre: 'Microondas Samsung 28L',
        proveedorNombre: 'Electrónica del Sur',
        codigoProveedor: 'SUR-SAM-MIC-002',
      },
      {
        productoNombre: 'Licuadora Philips 700W',
        proveedorNombre: 'Electrónica del Sur',
        codigoProveedor: 'SUR-PHI-LIC-002',
      },
    ];

    for (const relation of productoProveedorRelations) {
      const producto = getProducto(relation.productoNombre);
      const proveedor = getProveedor(relation.proveedorNombre);

      if (producto && proveedor) {
        const existingRelation = await productoProveedorRepository.findOne({
          where: {
            idProducto: producto.idProducto,
            idProveedor: proveedor.idProveedor,
            codigoProveedor: relation.codigoProveedor,
          },
        });

        if (!existingRelation) {
          const productoProveedor = productoProveedorRepository.create({
            idProducto: producto.idProducto,
            idProveedor: proveedor.idProveedor,
            codigoProveedor: relation.codigoProveedor,
          });
          await productoProveedorRepository.save(productoProveedor);
          console.log(
            `  ✅ Relación creada: ${producto.nombre} - ${proveedor.nombre}`,
          );
        } else {
          console.log(
            `  ⏭️  Relación ${producto.nombre} - ${proveedor.nombre} ya existe`,
          );
        }
      } else {
        console.log(
          `  ⚠️  No se encontró producto o proveedor para: ${relation.productoNombre} - ${relation.proveedorNombre}`,
        );
      }
    }

    console.log('✅ Seed de catálogo y productos completado exitosamente');
    console.log(`
📊 Resumen:
   - ${lineas.length} líneas
   - ${marcas.length} marcas
   - ${productos.length} productos
   - ${proveedores.length} proveedores
    `);
  } catch (error) {
    console.error('❌ Error creating catalog and products data', error);
    throw error;
  } finally {
    // Close the database connection
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}
