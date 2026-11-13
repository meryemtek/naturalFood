// Unified persistence store for Natural Food Products & Inventory
// Keeps products and warehouse inventory 100% in sync and persists across page reloads (F5)

export interface ProductItem {
  id: number;
  name: string;
  category: string;
  sku: string;
  barcode: string;
  unitType: 'Litre' | 'Kg' | 'Gramaj' | 'Adet';
  unitValue: string;
  price: string;
  stock: string;
  status: 'Satışta' | 'Kritik Stok' | 'Tükendi';
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  stock: number;
  unit: string;
  unitPrice: number;
  lastUpdated: string;
}

const PRODUCTS_STORAGE_KEY = 'natural_food_products_data_v1';
const INVENTORY_STORAGE_KEY = 'natural_food_inventory_data_v1';
const SYNC_EVENT_NAME = 'natural-food-inventory-sync';

// Initial curated products
export const INITIAL_PRODUCTS: ProductItem[] = [
  {
    id: 1,
    name: 'Organik Soğuk Sıkım Sızma Zeytinyağı',
    category: 'Zeytinyağları',
    sku: 'SKU-ORG-OIL-500',
    barcode: '8690123456012',
    unitType: 'Litre',
    unitValue: '0.5 L',
    price: '₺385.00',
    stock: '142 Adet',
    status: 'Satışta',
  },
  {
    id: 2,
    name: 'Taş Değirmen Organik Siyez Unu',
    category: 'Kuru Gıdalar & Bakliyat',
    sku: 'SKU-ORG-FLR-1000',
    barcode: '8690123456029',
    unitType: 'Kg',
    unitValue: '1.0 kg',
    price: '₺84.50',
    stock: '320 Kg',
    status: 'Satışta',
  },
  {
    id: 3,
    name: 'Şirden Mayalı Trakya Eski Kaşar Peyniri',
    category: 'Köy Kahvaltılıkları',
    sku: 'SKU-CHZ-KAS-350',
    barcode: '8690123456036',
    unitType: 'Gramaj',
    unitValue: '350 g',
    price: '₺215.00',
    stock: '4 Adet',
    status: 'Kritik Stok',
  },
  {
    id: 4,
    name: "Gezen Tavuk Organik Köy Yumurtası (10'lu)",
    category: 'Köy Kahvaltılıkları',
    sku: 'SKU-EGG-VIL-10',
    barcode: '8690123456043',
    unitType: 'Adet',
    unitValue: '10 Adet Paket',
    price: '₺110.00',
    stock: '2 Paket',
    status: 'Kritik Stok',
  },
  {
    id: 5,
    name: 'Ham Çiğ Fıstık & Badem Karışımı',
    category: 'Kuruyemiş & Kuru Meyve',
    sku: 'SKU-NUT-MIX-250',
    barcode: '8690123456050',
    unitType: 'Gramaj',
    unitValue: '250 g',
    price: '₺165.00',
    stock: '0 Adet',
    status: 'Tükendi',
  },
  {
    id: 6,
    name: 'Doğal Yayık Köy Tereyağı',
    category: 'Köy Kahvaltılıkları',
    sku: 'SKU-BTR-YAY-500',
    barcode: '8690123456067',
    unitType: 'Kg',
    unitValue: '0.5 kg',
    price: '₺290.00',
    stock: '42 Kg',
    status: 'Satışta',
  },
];

// Helper: Parse numeric stock from string (e.g., "142 Adet" -> 142)
export function parseStockNumber(stockStr: string | number): number {
  if (typeof stockStr === 'number') return stockStr;
  const num = parseInt(stockStr.replace(/[^0-9]/g, ''), 10);
  return isNaN(num) ? 0 : num;
}

// Helper: Parse numeric price from currency string (e.g., "₺385.00" -> 385.00)
export function parsePriceNumber(priceStr: string | number): number {
  if (typeof priceStr === 'number') return priceStr;
  const clean = priceStr.replace(/[^0-9.,]/g, '').replace(',', '.');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

// Helper: Convert a product item to an inventory item
export function productToInventoryItem(prod: ProductItem): InventoryItem {
  return {
    id: String(prod.id),
    sku: prod.sku,
    name: prod.name,
    category: prod.category,
    stock: parseStockNumber(prod.stock),
    unit: prod.unitType || 'Adet',
    unitPrice: parsePriceNumber(prod.price),
    lastUpdated: 'Bugün ' + new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
  };
}

class ProductInventoryStore {
  // Read all products from localStorage (or fallback to initial products)
  public getProducts(): ProductItem[] {
    try {
      const saved = localStorage.getItem(PRODUCTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Ürünler localStorage okunamadı, varsayılan liste yükleniyor:', e);
    }
    // Initialize if not present
    this.saveProducts(INITIAL_PRODUCTS, false);
    return INITIAL_PRODUCTS;
  }

  // Save products and broadcast sync
  public saveProducts(products: ProductItem[], broadcast = true): void {
    try {
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
      // Keep inventory in sync
      this.syncInventoryFromProducts(products);
      if (broadcast) {
        this.notifyChange();
      }
    } catch (e) {
      console.error('Ürünler localStorage kaydedilemedi:', e);
    }
  }

  // Read inventory items from localStorage
  public getInventory(): InventoryItem[] {
    try {
      const saved = localStorage.getItem(INVENTORY_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Envanter localStorage okunamadı:', e);
    }

    // Generate from current products
    const prods = this.getProducts();
    const inv = prods.map(productToInventoryItem);
    this.saveInventory(inv, false);
    return inv;
  }

  // Save inventory items
  public saveInventory(items: InventoryItem[], broadcast = true): void {
    try {
      localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(items));
      if (broadcast) {
        this.notifyChange();
      }
    } catch (e) {
      console.error('Envanter kaydedilemedi:', e);
    }
  }

  // Synchronize inventory when products change
  private syncInventoryFromProducts(products: ProductItem[]): void {
    const currentInventory = this.getInventory();
    const inventoryMap = new Map<string, InventoryItem>();
    currentInventory.forEach((inv) => inventoryMap.set(inv.sku, inv));

    const updatedInventory: InventoryItem[] = products.map((prod) => {
      const existing = inventoryMap.get(prod.sku);
      const stockNum = parseStockNumber(prod.stock);
      const priceNum = parsePriceNumber(prod.price);

      return {
        id: String(prod.id),
        sku: prod.sku,
        name: prod.name,
        category: prod.category,
        stock: stockNum,
        unit: prod.unitType || 'Adet',
        unitPrice: priceNum,
        lastUpdated: existing ? existing.lastUpdated : 'Yeni Eklendi',
      };
    });

    try {
      localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(updatedInventory));
    } catch (e) {
      console.error('Envanter senkronizasyon hatası:', e);
    }
  }

  // Add a new product (adds to products AND automatically adds to inventory)
  public addProduct(prod: ProductItem): void {
    const products = this.getProducts();
    const updated = [prod, ...products];
    this.saveProducts(updated);
  }

  // Update existing product
  public updateProduct(updatedProd: ProductItem): void {
    const products = this.getProducts();
    const updated = products.map((p) => (p.id === updatedProd.id ? updatedProd : p));
    this.saveProducts(updated);
  }

  // Update inventory stock (e.g. from InventoryPage quick +1 / -1)
  // Also updates the product stock text and status
  public updateStockDelta(inventoryId: string, delta: number): void {
    const inventory = this.getInventory();
    const targetItem = inventory.find((i) => i.id === inventoryId);
    if (!targetItem) return;

    const newStock = Math.max(0, targetItem.stock + delta);
    const updatedInventory = inventory.map((item) =>
      item.id === inventoryId
        ? {
            ...item,
            stock: newStock,
            lastUpdated: 'Bugün ' + new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
          }
        : item
    );
    this.saveInventory(updatedInventory, false);

    // Sync back to products list
    const products = this.getProducts();
    const updatedProducts = products.map((p) => {
      if (String(p.id) === inventoryId || p.sku === targetItem.sku) {
        let status: 'Satışta' | 'Kritik Stok' | 'Tükendi' = 'Satışta';
        if (newStock === 0) status = 'Tükendi';
        else if (newStock <= 5) status = 'Kritik Stok';

        return {
          ...p,
          stock: `${newStock} ${p.unitType || 'Adet'}`,
          status,
        };
      }
      return p;
    });

    try {
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(updatedProducts));
    } catch (e) {
      console.error(e);
    }

    this.notifyChange();
  }

  // Notify listeners across components and tabs
  public notifyChange(): void {
    window.dispatchEvent(new CustomEvent(SYNC_EVENT_NAME));
  }

  // Subscription helper
  public subscribe(callback: () => void): () => void {
    const handler = () => callback();
    window.addEventListener(SYNC_EVENT_NAME, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(SYNC_EVENT_NAME, handler);
      window.removeEventListener('storage', handler);
    };
  }
}

export const productInventoryStore = new ProductInventoryStore();
