import { db } from '../lib/db';

const demoProducts = [
  {
    name: 'Ноутбук Lenovo ThinkPad X1 Carbon',
    description: 'Профессиональный ультрабук с процессором Intel Core i7, 16GB RAM, 512GB SSD. Идеален для бизнеса и работы.',
    price: 125000,
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=600&fit=crop',
    category: 'Электроника',
    stock: 15,
  },
  {
    name: 'Смартфон Samsung Galaxy S24 Ultra',
    description: 'Флагманский смартфон с камерой 200MP, экраном 6.8" и процессором Snapdragon 8 Gen 3. 256GB памяти.',
    price: 89900,
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=600&fit=crop',
    category: 'Электроника',
    stock: 32,
  },
  {
    name: 'Беспроводные наушники Sony WH-1000XM5',
    description: 'Премиум наушники с активным шумоподавлением, автономностью до 30 часов и превосходным звуком.',
    price: 34900,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=600&fit=crop',
    category: 'Аудио',
    stock: 48,
  },
  {
    name: 'Монитор Dell UltraSharp 27" 4K',
    description: 'Профессиональный монитор с разрешением 4K UHD, цветовым охватом 99% sRGB и USB-C подключением.',
    price: 45900,
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&h=600&fit=crop',
    category: 'Мониторы',
    stock: 22,
  },
  {
    name: 'Клавиатура Logitech MX Keys',
    description: 'Беспроводная клавиатура с подсветкой, эргономичным дизайном и поддержкой до 3 устройств одновременно.',
    price: 12900,
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&h=600&fit=crop',
    category: 'Периферия',
    stock: 67,
  },
  {
    name: 'Мышь Logitech MX Master 3S',
    description: 'Беспроводная мышь для профессионалов с точным сенсором, эргономичным дизайном и автономностью до 70 дней.',
    price: 8990,
    image: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=800&h=600&fit=crop',
    category: 'Периферия',
    stock: 89,
  },
  {
    name: 'Планшет iPad Pro 12.9"',
    description: 'Планшет с чипом M2, экраном Liquid Retina XDR 12.9", поддержкой Apple Pencil и Magic Keyboard.',
    price: 129900,
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&h=600&fit=crop',
    category: 'Планшеты',
    stock: 18,
  },
  {
    name: 'Веб-камера Logitech Brio 4K',
    description: 'Профессиональная веб-камера с разрешением 4K, HDR и автофокусом. Идеальна для видеоконференций.',
    price: 18900,
    image: 'https://images.unsplash.com/photo-1587825147138-0bc2740bf9a5?w=800&h=600&fit=crop',
    category: 'Периферия',
    stock: 41,
  },
];

function createDemoProducts() {
  console.log('Создание демо-товаров...\n');
  
  const existingProducts = db.products.getAll();
  if (existingProducts.length > 0) {
    console.log(`В базе уже есть ${existingProducts.length} товаров.`);
    console.log('Добавляю новые демо-товары...\n');
  }

  demoProducts.forEach((product) => {
    const created = db.products.create({
      ...product,
      unit: 'dona' as const,
    });
    console.log(`✓ Создан товар: ${created.name} (${created.price.toLocaleString()} ₽)`);
  });

  console.log(`\n✅ Создано ${demoProducts.length} демо-товаров!`);
  console.log('Откройте http://localhost:3000 чтобы увидеть товары');
}

createDemoProducts();

