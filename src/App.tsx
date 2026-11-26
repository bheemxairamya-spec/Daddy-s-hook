/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import {
  BrowserRouter,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import { StoreProvider, useStore } from './context/StoreContext';
import { AnnouncementBar } from './components/AnnouncementBar';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { QuickViewModal } from './components/QuickViewModal';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { CustomCursor } from './components/CustomCursor';
import { ScrollProgress } from './components/ScrollProgress';
import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { WishlistPage } from './pages/WishlistPage';
import { LoginPage } from './pages/LoginPage';
import { AdminPage } from './pages/AdminPage';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);
  return null;
}

function ToastRack() {
  const { toasts } = useStore();
  if (toasts.length === 0) return null;
  return (
    <div
      aria-live="polite"
      className="fixed bottom-20 right-4 sm:right-6 z-50 flex flex-col gap-2 max-w-xs"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="animate-dh-toast-in bg-[#0F3720] text-[#F7F3EA] border border-[#B8934A] rounded-[8px] px-4 py-3 font-ui text-[12px] tracking-[0.16em] shadow-md"
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}

function AppShell() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F3EA] dark:bg-[#081E12] text-[#2E3F34] dark:text-[#F7F3EA] transition-colors duration-500 ease-out">
      <ScrollToTop />
      <CustomCursor />
      <ScrollProgress />

      <AnnouncementBar />
      <Header />

      <main className="flex-1">
        <div key={location.pathname} className="animate-dh-page-enter">
          <Routes location={location}>
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/product/:slug" element={<ProductDetailPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-confirmation/:id" element={<OrderConfirmationPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<HomePage />} />
          </Routes>
        </div>
      </main>

      <Footer />
      <FloatingWhatsApp />
      <CartDrawer />
      <QuickViewModal />
      <ToastRack />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </StoreProvider>
  );
}
