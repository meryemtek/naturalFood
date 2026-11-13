import { GuestOrderTrackingPage } from './pages/account/GuestOrderTrackingPage';
import { OrdersPage } from './pages/admin/OrdersPage';
import React from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { StorefrontPage } from './pages/storefront/StorefrontPage';
import { OurStoryPage } from './pages/storefront/OurStoryPage';
import { StorefrontNotFoundPage } from './pages/storefront/StorefrontNotFoundPage';
import { ProductsPage } from './pages/products/ProductsPage';
import { ProductDetailPage } from './pages/products/ProductDetailPage';
import { CartPage } from './pages/cart/CartPage';
import { CheckoutPage } from './pages/checkout/CheckoutPage';
import { MainLayout } from './components/layout/MainLayout';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { PermissionProvider, PermissionGuard, AdminAuthGuard } from './context/PermissionContext';
import { UsersPage } from './pages/admin/UsersPage';
import { RolePermissionsPage } from './pages/admin/RolePermissionsPage';
import { AuditLogsPage } from './pages/admin/AuditLogsPage';
import { InventoryPage } from './pages/inventory/InventoryPage';
import { SupplierProcurementPage } from './pages/inventory/SupplierProcurementPage';
import { CustomerReviewsPage } from './pages/crm/CustomerReviewsPage';
import { ModulePlaceholderPage } from './pages/common/ModulePlaceholderPage';
import {
  ProductDefinitionPage,
  AllergensNutritionPage,
  LotExpiryTrackingPage,
  StorageConditionsPage,
} from './pages/products/FoodProductPages';

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
        <Route path="/siparis-takip" element={<GuestOrderTrackingPage />} />
        <Route path="/odeme" element={<CheckoutPage />} />

        {/* İzole Yönetim Paneli Rotaları */}
        <Route
          element={
            <PermissionProvider>
              <Outlet />
            </PermissionProvider>
          }
        >
          <Route path="admin/login" element={<Navigate to="/giris" replace />} />
          <Route
            element={
              <AdminAuthGuard>
                <MainLayout />
              </AdminAuthGuard>
            }
          >
          <Route path="dashboard" element={<DashboardPage />} />

          {/* 1. Ürün ve Menü Yönetimi (Özel Doğal Gıda Modülleri) */}
          <Route path="products" element={<PermissionGuard requiredPermission="products.view"><ProductDefinitionPage /></PermissionGuard>} />
          <Route path="products/definition" element={<PermissionGuard requiredPermission="products.view"><ProductDefinitionPage /></PermissionGuard>} />
          <Route path="products/allergens-nutrition" element={<PermissionGuard requiredPermission="products.view"><AllergensNutritionPage /></PermissionGuard>} />
          <Route path="products/lot-expiry" element={<PermissionGuard requiredPermission="products.view"><LotExpiryTrackingPage /></PermissionGuard>} />
          <Route path="products/storage-conditions" element={<PermissionGuard requiredPermission="storage.view"><StorageConditionsPage /></PermissionGuard>} />

          {/* 2. Sipariş ve Sevkiyat Yönetimi */}
          <Route path="orders" element={<PermissionGuard requiredPermission="orders.view"><OrdersPage /></PermissionGuard>} />
          <Route path="orders/pending" element={<PermissionGuard requiredPermission="orders.view"><OrdersPage /></PermissionGuard>} />
          <Route path="orders/completed" element={<PermissionGuard requiredPermission="orders.view"><OrdersPage /></PermissionGuard>} />
          <Route path="orders/returns" element={<PermissionGuard requiredPermission="orders.view"><OrdersPage /></PermissionGuard>} />
          <Route path="shipping/shipments" element={<PermissionGuard requiredPermission="orders.view"><ModulePlaceholderPage /></PermissionGuard>} />
          <Route path="shipping/carriers" element={<PermissionGuard requiredPermission="orders.view"><ModulePlaceholderPage /></PermissionGuard>} />
          <Route path="shipping/zones" element={<PermissionGuard requiredPermission="orders.view"><ModulePlaceholderPage /></PermissionGuard>} />

          {/* 3. Stok ve Depo Yönetimi */}
          <Route path="inventory" element={<PermissionGuard requiredPermission="inventory.view"><InventoryPage /></PermissionGuard>} />
          <Route path="inventory/suppliers-procurement" element={<PermissionGuard requiredPermission="inventory.view"><SupplierProcurementPage /></PermissionGuard>} />
          <Route path="inventory/warehouses" element={<PermissionGuard requiredPermission="storage.view"><ModulePlaceholderPage /></PermissionGuard>} />
          <Route path="inventory/transactions" element={<PermissionGuard requiredPermission="inventory.view"><ModulePlaceholderPage /></PermissionGuard>} />
          <Route path="inventory/alerts" element={<PermissionGuard requiredPermission="inventory.view"><ModulePlaceholderPage /></PermissionGuard>} />

          {/* 4. Müşteri İlişkileri ve Destek (CRM) */}
          <Route path="crm/customers" element={<PermissionGuard requiredPermission="crm.manage"><ModulePlaceholderPage /></PermissionGuard>} />
          <Route path="crm/segments" element={<PermissionGuard requiredPermission="crm.manage"><ModulePlaceholderPage /></PermissionGuard>} />
          <Route path="crm/tickets" element={<PermissionGuard requiredPermission="crm.manage"><ModulePlaceholderPage /></PermissionGuard>} />
          <Route path="crm/reviews" element={<PermissionGuard requiredPermission="crm.reviews"><CustomerReviewsPage /></PermissionGuard>} />

          {/* 5. Pazarlama ve Kampanya Yönetimi */}
          <Route path="marketing/coupons" element={<PermissionGuard requiredPermission="marketing.view"><ModulePlaceholderPage /></PermissionGuard>} />
          <Route path="marketing/campaigns" element={<PermissionGuard requiredPermission="marketing.view"><ModulePlaceholderPage /></PermissionGuard>} />
          <Route path="marketing/flash-sales" element={<PermissionGuard requiredPermission="marketing.view"><ModulePlaceholderPage /></PermissionGuard>} />
          <Route path="marketing/loyalty" element={<PermissionGuard requiredPermission="marketing.view"><ModulePlaceholderPage /></PermissionGuard>} />
          <Route path="marketing/newsletters" element={<PermissionGuard requiredPermission="marketing.view"><ModulePlaceholderPage /></PermissionGuard>} />

          {/* 6. Raporlama ve Analitik */}
          <Route path="analytics/sales" element={<PermissionGuard requiredPermission="finance.reports"><ModulePlaceholderPage /></PermissionGuard>} />
          <Route path="analytics/revenue" element={<PermissionGuard requiredPermission="finance.reports"><ModulePlaceholderPage /></PermissionGuard>} />
          <Route path="analytics/products" element={<PermissionGuard requiredPermission="finance.reports"><ModulePlaceholderPage /></PermissionGuard>} />
          <Route path="analytics/traffic" element={<PermissionGuard requiredPermission="finance.reports"><ModulePlaceholderPage /></PermissionGuard>} />

          {/* 7. Rol, Güvenlik ve Sistem Ayarları */}
          <Route path="admin/users" element={<PermissionGuard requiredPermission="users.manage"><UsersPage /></PermissionGuard>} />
          <Route path="admin/roles" element={<PermissionGuard requiredPermission="users.manage"><RolePermissionsPage /></PermissionGuard>} />
          <Route path="admin/audit-logs" element={<PermissionGuard requiredPermission="users.manage"><AuditLogsPage /></PermissionGuard>} />
          <Route path="settings/security" element={<PermissionGuard requiredPermission="users.manage"><ModulePlaceholderPage /></PermissionGuard>} />
          <Route path="settings/payments" element={<PermissionGuard requiredPermission="finance.reports"><ModulePlaceholderPage /></PermissionGuard>} />
          <Route path="settings/invoicing" element={<PermissionGuard requiredPermission="finance.reports"><ModulePlaceholderPage /></PermissionGuard>} />
          <Route path="settings/general" element={<PermissionGuard requiredPermission="users.manage"><ModulePlaceholderPage /></PermissionGuard>} />
          </Route>
        </Route>
        <Route path="*" element={<StorefrontNotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
