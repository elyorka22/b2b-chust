'use client';

export interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  unit?: string;
  image?: string;
}

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  const cart = localStorage.getItem('cart');
  return cart ? JSON.parse(cart) : [];
}

export function saveCart(cart: CartItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('cart', JSON.stringify(cart));
}

export function addToCart(item: CartItem): void {
  const cart = getCart();
  const existingIndex = cart.findIndex(i => i.productId === item.productId);
  if (existingIndex >= 0) {
    cart[existingIndex].quantity += item.quantity;
  } else {
    cart.push(item);
  }
  saveCart(cart);
}

export function removeFromCart(productId: string): void {
  const cart = getCart();
  const filtered = cart.filter(i => i.productId !== productId);
  saveCart(filtered);
}

export function updateCartItem(productId: string, quantity: number): void {
  const cart = getCart();
  const item = cart.find(i => i.productId === productId);
  if (item) {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      item.quantity = quantity;
      saveCart(cart);
    }
  }
}

export function clearCart(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('cart');
}

export function getCartTotal(): number {
  const cart = getCart();
  return cart.reduce((total, item) => total + item.price * item.quantity, 0);
}

