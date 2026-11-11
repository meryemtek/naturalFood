import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { UsersPage } from './pages/admin/UsersPage';
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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />

          {/* 1. Ürün ve Menü Yönetimi (Özel Doğal Gıda Modülleri) */}
          <Route path="products" element={<ProductDefinitionPage />} />
          <Route path="products/definition" element={<ProductDefinitionPage />} />
          <Route path="products/allergens-nutrition" element={<AllergensNutritionPage />} />
          <Route path="products/lot-expiry" element={<LotExpiryTrackingPage />} />
          <Route path="products/storage-conditions" element={<StorageConditionsPage />} />

          {/* 2. Sipariş ve Sevkiyat Yönetimi */}
          <Route path="orders" element={<ModulePlaceholderPage />} />
          <Route path="orders/pending" element={<ModulePlaceholderPage />} />
          <Route path="orders/completed" element={<ModulePlaceholderPage />} />
          <Route path="orders/returns" element={<ModulePlaceholderPage />} />
          <Route path="shipping/shipments" element={<ModulePlaceholderPage />} />
          <Route path="shipping/carriers" element={<ModulePlaceholderPage />} />
          <Route path="shipping/zones" element={<ModulePlaceholderPage />} />

          {/* 3. Stok ve Depo Yönetimi */}
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="inventory/suppliers-procurement" element={<SupplierProcurementPage />} />
          <Route path="inventory/warehouses" element={<ModulePlaceholderPage />} />
          <Route path="inventory/transactions" element={<ModulePlaceholderPage />} />
          <Route path="inventory/alerts" element={<ModulePlaceholderPage />} />

          {/* 4. Müşteri İlişkileri ve Destek (CRM) */}
          <Route path="crm/customers" element={<ModulePlaceholderPage />} />
          <Route path="crm/segments" element={<ModulePlaceholderPage />} />
          <Route path="crm/tickets" element={<ModulePlaceholderPage />} />
          <Route path="crm/reviews" element={<CustomerReviewsPage />} />

          {/* 5. Pazarlama ve Kampanya Yönetimi */}
          <Route path="marketing/coupons" element={<ModulePlaceholderPage />} />
          <Route path="marketing/campaigns" element={<ModulePlaceholderPage />} />
          <Route path="marketing/flash-sales" element={<ModulePlaceholderPage />} />
          <Route path="marketing/loyalty" element={<ModulePlaceholderPage />} />
          <Route path="marketing/newsletters" element={<ModulePlaceholderPage />} />

          {/* 6. Raporlama ve Analitik */}
          <Route path="analytics/sales" element={<ModulePlaceholderPage />} />
          <Route path="analytics/revenue" element={<ModulePlaceholderPage />} />
          <Route path="analytics/products" element={<ModulePlaceholderPage />} />
          <Route path="analytics/traffic" element={<ModulePlaceholderPage />} />

          {/* 7. Rol, Güvenlik ve Sistem Ayarları */}
          <Route path="admin/users" element={<UsersPage />} />
          <Route path="admin/audit-logs" element={<AuditLogsPage />} />
          <Route path="settings/security" element={<ModulePlaceholderPage />} />
          <Route path="settings/payments" element={<ModulePlaceholderPage />} />
          <Route path="settings/invoicing" element={<ModulePlaceholderPage />} />
          <Route path="settings/general" element={<ModulePlaceholderPage />} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
