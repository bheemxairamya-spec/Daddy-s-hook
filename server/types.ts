export type MainCategory = 'men' | 'women';

export type OrderStatus = 'Pending' | 'Packed' | 'Shipped' | 'Delivered';

export type PaymentMethod = 'COD' | 'RAZORPAY_UPI';

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: MainCategory;
  subcategory: string;
  price: number;
  compareAtPrice?: number;
  sizes: string[];
  colors: string[];
  images: string[];
  description: string;
  fabric: string;
  fit: string;
  gsm: string;
  stock: number;
  inStock: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  slug: string;
  name: string;
  price: number;
  size: string;
  color: string;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  pincode: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentRef?: string;
  status: OrderStatus;
  streakStampAwarded: boolean;
  createdAt: string;
}

export interface StreakEntry {
  date: string;
  note: string;
  orderId?: string;
}

export interface StreakCard {
  phone: string;
  customerName?: string;
  stamps: number;
  prizesClaimed: number;
  prizeClaimedPendingReset: boolean;
  history: StreakEntry[];
  updatedAt: string;
}

export interface ContactInquiry {
  id: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  createdAt: string;
}

export interface StoreConfig {
  shopName: string;
  tagline: string;
  freeDeliveryThreshold: number;
  streakTarget: number;
  streakPrizeName: string;
  whatsappNumber: string;
  instagramHandle: string;
  storeAddress: string;
  storePhone: string;
  mapUrl: string;
}

export interface DatabaseSchema {
  products: Product[];
  orders: Order[];
  streaks: StreakCard[];
  inquiries: ContactInquiry[];
}
