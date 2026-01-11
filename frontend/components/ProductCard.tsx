'use client';

import { Product } from '@/lib/db';
import { addToCart } from '@/lib/cart';
import { useState } from 'react';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [showCounter, setShowCounter] = useState(false);

  const handleAddToCart = () => {
    addToCart({
      productId: product.id,
      productName: product.name,
      price: product.price,
      quantity,
      unit: product.unit || 'dona',
      image: product.image,
      storeId: product.storeId, // Сохраняем storeId товара
    });
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
          {!showCounter ? (
            <button
              onClick={() => setShowCounter(true)}
              disabled={product.stock === 0}
              className="w-8 h-8 md:w-9 md:h-9 bg-black text-white rounded-full shadow-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center transition-all"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          ) : (
            <div className="flex items-center bg-white border border-gray-300 rounded-lg overflow-hidden shadow-lg">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="px-2 md:px-2.5 py-1 md:py-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 font-medium text-sm md:text-base"
              >
                −
              </button>
              <span className="w-8 md:w-10 px-1.5 md:px-2 py-1 md:py-1.5 text-center text-xs md:text-sm font-semibold">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                disabled={quantity >= product.stock}
                className="px-2 md:px-2.5 py-1 md:py-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 font-medium text-sm md:text-base"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="p-3 md:p-5">
        <h3 className="text-sm md:text-lg font-bold mb-1 md:mb-2 text-gray-900 line-clamp-2 min-h-[2.5rem] md:min-h-[3.5rem]">
          {product.name}
        </h3>
        <p className="text-gray-600 text-xs md:text-sm mb-2 md:mb-4 line-clamp-2 min-h-[2rem] md:min-h-[2.5rem]">
          {product.description}
        </p>
        <div className="mb-2 md:mb-4 pb-2 md:pb-4 border-b border-gray-100">
          <span className="text-lg md:text-2xl font-bold text-black">
            {product.price.toLocaleString()} so'm/{product.unit || 'dona'}
          </span>
        </div>
        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0 || added}
          className={`w-full px-3 md:px-4 py-2 md:py-2.5 rounded-lg text-sm md:text-base font-semibold transition-all duration-200 ${
            product.stock === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : added
              ? 'bg-emerald-500 text-white shadow-md'
              : 'bg-black text-white hover:bg-gray-800 hover:shadow-lg active:scale-95'
          }`}
        >
          {added ? '✓ Qo\'shildi!' : product.stock === 0 ? 'Mavjud emas' : 'Savatga qo\'shish'}
        </button>
      </div>
    </div>
  );
}

