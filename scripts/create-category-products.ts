import { db } from '../lib/db';

const categoryProducts = [
  // Снеки
  {
    name: 'Чипсы Lay\'s Классические 150г',
    description: 'Хрустящие картофельные чипсы с классическим вкусом. Упаковка 150 грамм. Идеально для офисных перекусов.',
    price: 89,
    image: 'https://images.unsplash.com/photo-1613919113643-748c8c4d6c3e?w=800&h=600&fit=crop',
    category: 'Снеки',
    stock: 250,
  },
  {
    name: 'Орешки соленые ассорти 200г',
    description: 'Смесь соленых орехов: арахис, миндаль, кешью. Упаковка 200 грамм. Богаты белком и полезными жирами.',
    price: 299,
    image: 'https://images.unsplash.com/photo-1599599810769-92c0c5c9634a?w=800&h=600&fit=crop',
    category: 'Снеки',
    stock: 180,
  },
  {
    name: 'Сухарики Хрустим со вкусом сыра 100г',
    description: 'Хрустящие сухарики с насыщенным сырным вкусом. Упаковка 100 грамм. Отлично подходят для перекуса.',
    price: 65,
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&h=600&fit=crop',
    category: 'Снеки',
    stock: 320,
  },
  {
    name: 'Попкорн карамельный 120г',
    description: 'Сладкий попкорн с карамелью. Упаковка 120 грамм. Идеален для офисных мероприятий и перерывов.',
    price: 95,
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop',
    category: 'Снеки',
    stock: 200,
  },
  {
    name: 'Печенье овсяное с шоколадом 200г',
    description: 'Полезное овсяное печенье с кусочками шоколада. Упаковка 200 грамм. Натуральные ингредиенты.',
    price: 149,
    image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&h=600&fit=crop',
    category: 'Снеки',
    stock: 150,
  },
  
  // Газыровки
  {
    name: 'Coca-Cola 0.5л',
    description: 'Классическая газированная вода Coca-Cola. Бутылка 0.5 литра. Освежающий вкус для офиса.',
    price: 79,
    image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=800&h=600&fit=crop',
    category: 'Газыровки',
    stock: 500,
  },
  {
    name: 'Pepsi 0.5л',
    description: 'Газированный напиток Pepsi. Бутылка 0.5 литра. Популярный выбор для офисных кулеров.',
    price: 75,
    image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800&h=600&fit=crop',
    category: 'Газыровки',
    stock: 480,
  },
  {
    name: 'Fanta Апельсин 0.5л',
    description: 'Газированный напиток Fanta с апельсиновым вкусом. Бутылка 0.5 литра. Освежающий цитрусовый вкус.',
    price: 79,
    image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800&h=600&fit=crop',
    category: 'Газыровки',
    stock: 420,
  },
  {
    name: 'Sprite 0.5л',
    description: 'Лимонно-лаймовая газировка Sprite. Бутылка 0.5 литра. Освежающий вкус без кофеина.',
    price: 79,
    image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800&h=600&fit=crop',
    category: 'Газыровки',
    stock: 450,
  },
  {
    name: 'Вода газированная Боржоми 0.5л',
    description: 'Лечебно-столовая минеральная вода Боржоми. Бутылка 0.5 литра. Натуральная минерализация.',
    price: 149,
    image: 'https://images.unsplash.com/photo-1548839140-5a6c38e0e1c0?w=800&h=600&fit=crop',
    category: 'Газыровки',
    stock: 200,
  },
  {
    name: 'Энергетик Red Bull 0.25л',
    description: 'Энергетический напиток Red Bull. Банка 0.25 литра. Для повышения работоспособности.',
    price: 199,
    image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800&h=600&fit=crop',
    category: 'Газыровки',
    stock: 300,
  },
  
  // Расходники
  {
    name: 'Бумага для принтера А4 500 листов',
    description: 'Офисная бумага для принтера формата А4. Плотность 80 г/м². Упаковка 500 листов. Белая, качественная.',
    price: 399,
    image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=800&h=600&fit=crop',
    category: 'Расходники',
    stock: 100,
  },
  {
    name: 'Картридж HP 305 черный',
    description: 'Картридж для принтера HP 305 черный. Оригинальный расходный материал. Высокое качество печати.',
    price: 2490,
    image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=800&h=600&fit=crop',
    category: 'Расходники',
    stock: 45,
  },
  {
    name: 'Ручки шариковые синие 12 шт',
    description: 'Набор шариковых ручек синего цвета. 12 штук в упаковке. Удобные для письма, не протекают.',
    price: 199,
    image: 'https://images.unsplash.com/photo-1583484963886-cfe2bff2945f?w=800&h=600&fit=crop',
    category: 'Расходники',
    stock: 200,
  },
  {
    name: 'Блокноты А5 80 листов 10 шт',
    description: 'Набор блокнотов формата А5. 80 листов в каждом. 10 штук в упаковке. Линованные страницы.',
    price: 599,
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&h=600&fit=crop',
    category: 'Расходники',
    stock: 80,
  },
  {
    name: 'Скотч прозрачный 48мм x 50м',
    description: 'Упаковочный скотч прозрачный. Ширина 48мм, длина 50 метров. Высокая адгезия, прочный.',
    price: 89,
    image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=800&h=600&fit=crop',
    category: 'Расходники',
    stock: 150,
  },
  {
    name: 'Степлер офисный + скобы 1000 шт',
    description: 'Офисный степлер с комплектом скоб. Вмещает до 20 листов. Скобы 1000 штук в комплекте.',
    price: 399,
    image: 'https://images.unsplash.com/photo-1583484963886-cfe2bff2945f?w=800&h=600&fit=crop',
    category: 'Расходники',
    stock: 60,
  },
  {
    name: 'Маркеры перманентные 4 цвета',
    description: 'Набор перманентных маркеров. 4 цвета: черный, синий, красный, зеленый. Не стираются.',
    price: 249,
    image: 'https://images.unsplash.com/photo-1583484963886-cfe2bff2945f?w=800&h=600&fit=crop',
    category: 'Расходники',
    stock: 120,
  },
  {
    name: 'Папки-файлы А4 100 шт',
    description: 'Папки-файлы для документов формата А4. 100 штук в упаковке. Прозрачные, удобные для архива.',
    price: 899,
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&h=600&fit=crop',
    category: 'Расходники',
    stock: 70,
  },
];

function createCategoryProducts() {
  console.log('Создание товаров по категориям...\n');
  
  const existingProducts = db.products.getAll();
  console.log(`В базе уже есть ${existingProducts.length} товаров.`);
  console.log('Добавляю товары в категориях: Снеки, Газыровки, Расходники...\n');

  let created = 0;
  categoryProducts.forEach((product) => {
    const createdProduct = db.products.create({
      ...product,
      unit: 'dona' as const,
    });
    console.log(`✓ [${createdProduct.category}] ${createdProduct.name} - ${createdProduct.price.toLocaleString()} ₽`);
    created++;
  });

  console.log(`\n✅ Создано ${created} товаров в категориях!`);
  console.log('Откройте http://localhost:3000 чтобы увидеть товары');
}

createCategoryProducts();

