import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { StorefrontPage } from './pages/storefront/StorefrontPage';
import { OurStoryPage } from './pages/storefront/OurStoryPage';
import { StorefrontNotFoundPage } from './pages/storefront/StorefrontNotFoundPage';
import { ProductsPage } from './pages/products/ProductsPage';
import { ProductDetailPage } from './pages/products/ProductDetailPage';
import { CartPage } from './pages/cart/CartPage';
import { CheckoutPage } from './pages/checkout/CheckoutPage';
import { MainLayout } from './components/layout/MainLayout';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { UsersPage } from './pages/admin/UsersPage';
import { AuditLogsPage } from './pages/admin/AuditLogsPage';
import { InventoryPage } from './pages/inventory/InventoryPage';

const AuthPage = React.lazy(() => import('./pages/auth/AuthPage').then(module => ({ default: module.AuthPage })));
const AccountPage = React.lazy(() => import('./pages/account/AccountPage').then(module => ({ default: module.AccountPage })));

function AuthRoute({ initialMode = 'login' }: { initialMode?: 'login' | 'register' }) {
  return <React.Suspense fallback={<main className="grid min-h-[50vh] place-items-center bg-background text-primary">Hesap ekranı açılıyor…</main>}>
    <AuthPage initialMode={initialMode} />
  </React.Suspense>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Müşteri Mağazası & Ürünler Rotaları */}
        <Route path="/" element={<StorefrontPage />} />
        <Route path="/hikayemiz" element={<OurStoryPage />} />
        <Route path="/hikaye" element={<OurStoryPage />} />
        <Route path="/hesabim/*" element={<React.Suspense fallback={<main>Hesap ekranı açılıyor…</main>}><AccountPage /></React.Suspense>} />
        <Route path="/giris" element={<AuthRoute />} />
        <Route path="/uye-ol" element={<AuthRoute initialMode="register" />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/urunler" element={<ProductsPage />} />
        <Route path="/products/:slug" element={<ProductDetailPage />} />
        <Route path="/urun/:slug" element={<ProductDetailPage />} />
        <Route path="/product-detail" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/sepetim" element={<CartPage />} />
        <Route path="/odeme" element={<CheckoutPage />} />

        {/* Yönetim Paneli Rotaları */}
        <Route element={<MainLayout />}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="admin/users" element={<UsersPage />} />
          <Route path="admin/audit-logs" element={<AuditLogsPage />} />
          <Route path="inventory" element={<InventoryPage />} />
        </Route>
        <Route path="*" element={<StorefrontNotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
