'use client';

import { Product } from '@/lib/db';
import { addToCart, updateCartItem, getCart } from '@/lib/cart';
import { useState, useEffect } from 'react';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  // Загружаем текущее количество товара из корзины
  useEffect(() => {
    const cart = getCart();
    const cartItem = cart.find(item => item.productId === product.id);
    if (cartItem) {
      setQuantity(cartItem.quantity);
    }
  }, [product.id]);

  const handleQuantityChange = (change: number) => {
    const newQty = Math.max(1, Math.min(product.stock, quantity + change));
    setQuantity(newQty);
    
    const cart = getCart();
    const cartItem = cart.find(item => item.productId === product.id);
    
    if (cartItem) {
      // Товар уже в корзине - обновляем количество
      updateCartItem(product.id, newQty);
    } else {
      // Товара нет в корзине - добавляем
      addToCart({
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity: newQty,
        unit: product.unit || 'dona',
        image: product.image,
      });
    }
    
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
      <div className="relative overflow-hidden bg-gray-50">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-40 md:h-56 object-cover transition-transform duration-300 hover:scale-105"
            onError={(e) => {
              // Если изображение не загрузилось, заменяем на placeholder
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                const placeholder = document.createElement('div');
                placeholder.className = 'w-full h-40 md:h-56 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center';
                placeholder.innerHTML = '<span class="text-gray-400 text-xs md:text-sm">Rasm yo\'q</span>';
                parent.appendChild(placeholder);
              }
            }}
          />
        ) : (
          <div className="w-full h-40 md:h-56 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <span className="text-gray-400 text-xs md:text-sm">Rasm yo'q</span>
          </div>
        )}
        {product.stock < 10 && product.stock > 0 && (
          <div className="absolute top-2 right-2 md:top-3 md:right-3">
            <span className="bg-orange-500 text-white text-[10px] md:text-xs font-medium px-1.5 md:px-2 py-0.5 md:py-1 rounded-full shadow-sm">
              Kam qoldi
            </span>
          </div>
        )}
        <div className="absolute bottom-2 right-2 md:bottom-3 md:right-3">
          <div className="flex items-center bg-white border border-gray-300 rounded-lg overflow-hidden shadow-lg">
            <button
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1 || product.stock === 0}
              className="px-2 md:px-2.5 py-1 md:py-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 font-medium text-sm md:text-base"
            >
              −
            </button>
            <span className="w-8 md:w-10 px-1.5 md:px-2 py-1 md:py-1.5 text-center text-xs md:text-sm font-semibold">
              {quantity}
            </span>
            <button
              onClick={() => handleQuantityChange(1)}
              disabled={quantity >= product.stock || product.stock === 0}
              className="px-2 md:px-2.5 py-1 md:py-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 font-medium text-sm md:text-base"
            >
              +
            </button>
          </div>
        </div>
      </div>
      <div className="p-3 md:p-5">
        <h3 className="text-sm md:text-lg font-bold mb-1 md:mb-2 text-gray-900 line-clamp-2 min-h-[2.5rem] md:min-h-[3.5rem]">
          {product.name}
        </h3>
        <p className="text-gray-600 text-xs md:text-sm mb-2 md:mb-4 line-clamp-2 min-h-[2rem] md:min-h-[2.5rem]">
          {product.description}
        </p>
        <div className="mb-2 md:mb-4">
          <span className="text-lg md:text-2xl font-bold text-black">
            {product.price.toLocaleString()} so'm/{product.unit || 'dona'}
          </span>
        </div>
      </div>
    </div>
  );
}

