import type { Category, Product } from "../../api/storefront/storefrontApi";

export const demoCategories: Category[] = [
  {
    "id": "demo-cat-0",
    "name": "Köy Kahvaltılıkları",
    "slug": "demo-0",
    "description": "Köy peynirleri, petek bal, yayık tereyağı, kırık ve sele zeytinler.",
    "imageUrl": "/images/products/cat-kahvaltilik.jpg",
    "subCategories": []
  },
  {
    "id": "demo-cat-1",
    "name": "Taş Baskı Zeytinyağları",
    "slug": "demo-1",
    "description": "Erken hasat, soğuk sıkım Ayvalık ve Hatay dağ zeytinyağları.",
    "imageUrl": "/images/products/cat-zeytinyagi.jpg",
    "subCategories": []
  },
  {
    "id": "demo-cat-2",
    "name": "Güneşte Kurutulmuş Salça & Soslar",
    "slug": "demo-2",
    "description": "Gaziantep biber salçası, Hatay domates salçası, katkısız menemenlik.",
    "imageUrl": "/images/products/cat-salca.jpg",
    "subCategories": []
  },
  {
    "id": "demo-cat-3",
    "name": "Ev Yapımı Reçel & Bal",
    "slug": "demo-3",
    "description": "Toroslar ham çam balı, karadut reçeli, odun ateşinde incir reçeli.",
    "imageUrl": "/images/products/cat-bal-recel.jpg",
    "subCategories": []
  },
  {
    "id": "demo-cat-4",
    "name": "Yöresel Bakliyat & Erişte",
    "slug": "demo-4",
    "description": "Taş değirmen unları, el kesmesi köy eriştesi, Dermason fasulye.",
    "imageUrl": "/images/products/cat-bakliyat.jpg",
    "subCategories": []
  },
  {
    "id": "demo-cat-5",
    "name": "Kurutulmuş Meyve & Kuruyemiş",
    "slug": "demo-5",
    "description": "Malatya günkurusu kayısı, Aydın inciri, taze kırılmış köy cevizi.",
    "imageUrl": "/images/products/cat-kuruyemis.jpg",
    "subCategories": []
  }
];

export const demoProducts: Product[] = [
  {
    "id": "demo-product-0",
    "name": "Hatay Taş Baskı Erken Hasat Zeytinyağı",
    "slug": "demo-product-0",
    "shortDescription": "Yöresel ürün örneği",
    "categoryId": "demo-cat-1",
    "basePrice": 485.0,
    "discountPrice": null,
    "stockQuantity": 0,
    "unitInfo": "",
    "mainImageUrl": "/images/products/product-zeytinyagi.jpg",
    "isBestSeller": true,
    "isNew": false,
    "isFeatured": true,
    "variantCount": 0
  },
  {
    "id": "demo-product-1",
    "name": "Antep Güneşte Kurutulmuş Acı Biber Salçası",
    "slug": "demo-product-1",
    "shortDescription": "Yöresel ürün örneği",
    "categoryId": "demo-cat-2",
    "basePrice": 265.0,
    "discountPrice": null,
    "stockQuantity": 0,
    "unitInfo": "",
    "mainImageUrl": "/images/products/product-salca.jpg",
    "isBestSeller": true,
    "isNew": false,
    "isFeatured": true,
    "variantCount": 0
  },
  {
    "id": "demo-product-2",
    "name": "Kars Yayla Eski Kaşar Peyniri",
    "slug": "demo-product-2",
    "shortDescription": "Yöresel ürün örneği",
    "categoryId": "demo-cat-0",
    "basePrice": 340.0,
    "discountPrice": null,
    "stockQuantity": 0,
    "unitInfo": "",
    "mainImageUrl": "/images/products/product-kasar.jpg",
    "isBestSeller": true,
    "isNew": false,
    "isFeatured": true,
    "variantCount": 0
  },
  {
    "id": "demo-product-3",
    "name": "Toros Dağları Ham Karakovan Çam Balı",
    "slug": "demo-product-3",
    "shortDescription": "Yöresel ürün örneği",
    "categoryId": "demo-cat-3",
    "basePrice": 520.0,
    "discountPrice": null,
    "stockQuantity": 0,
    "unitInfo": "",
    "mainImageUrl": "/images/products/product-cam-bali.jpg",
    "isBestSeller": true,
    "isNew": false,
    "isFeatured": true,
    "variantCount": 0
  },
  {
    "id": "demo-product-4",
    "name": "El Kesmesi Yumurtalı Köy Eriştesi",
    "slug": "demo-product-4",
    "shortDescription": "Yöresel ürün örneği",
    "categoryId": "demo-cat-4",
    "basePrice": 110.0,
    "discountPrice": null,
    "stockQuantity": 0,
    "unitInfo": "",
    "mainImageUrl": "/images/products/product-tereyagi.jpg",
    "isBestSeller": true,
    "isNew": false,
    "isFeatured": true,
    "variantCount": 0
  },
  {
    "id": "demo-product-5",
    "name": "Trabzon Yayık Köy Tereyağı",
    "slug": "demo-product-5",
    "shortDescription": "Yöresel ürün örneği",
    "categoryId": "demo-cat-0",
    "basePrice": 490.0,
    "discountPrice": null,
    "stockQuantity": 0,
    "unitInfo": "",
    "mainImageUrl": "/images/products/halhali-zeytin.jpg",
    "isBestSeller": true,
    "isNew": false,
    "isFeatured": true,
    "variantCount": 0
  }
];

export const demoSeasonalProducts: Product[] = [
  {
    "id": "demo-season-0",
    "name": "İnce Kabuk Taze Köy Cevizi",
    "slug": "demo-season-0",
    "shortDescription": "Mevsimlik ürün örneği",
    "categoryId": "",
    "basePrice": 220.0,
    "discountPrice": null,
    "stockQuantity": 0,
    "unitInfo": "",
    "mainImageUrl": "/images/products/product-zeytinyagi.jpg",
    "isBestSeller": false,
    "isNew": true,
    "isFeatured": false,
    "variantCount": 0
  },
  {
    "id": "demo-season-1",
    "name": "Saf Nar Ekşisi (%100 Katkısız)",
    "slug": "demo-season-1",
    "shortDescription": "Mevsimlik ürün örneği",
    "categoryId": "",
    "basePrice": 195.0,
    "discountPrice": null,
    "stockQuantity": 0,
    "unitInfo": "",
    "mainImageUrl": "/images/products/product-zeytinyagi.jpg",
    "isBestSeller": false,
    "isNew": true,
    "isFeatured": false,
    "variantCount": 0
  },
  {
    "id": "demo-season-2",
    "name": "Kurutulmuş Cennet Hurması",
    "slug": "demo-season-2",
    "shortDescription": "Mevsimlik ürün örneği",
    "categoryId": "",
    "basePrice": 175.0,
    "discountPrice": null,
    "stockQuantity": 0,
    "unitInfo": "",
    "mainImageUrl": "/images/products/product-zeytinyagi.jpg",
    "isBestSeller": false,
    "isNew": true,
    "isFeatured": false,
    "variantCount": 0
  },
  {
    "id": "demo-season-3",
    "name": "Hakiki Manda Kaymağı",
    "slug": "demo-season-3",
    "shortDescription": "Mevsimlik ürün örneği",
    "categoryId": "",
    "basePrice": 160.0,
    "discountPrice": null,
    "stockQuantity": 0,
    "unitInfo": "",
    "mainImageUrl": "/images/products/product-zeytinyagi.jpg",
    "isBestSeller": false,
    "isNew": true,
    "isFeatured": false,
    "variantCount": 0
  }
];

export const demoSeasonDetails = [
  {
    "badge": "Yeni Kırılmış",
    "origin": "Kahramanmaraş • Göksun",
    "description": "Kolay kırılan, dolgun içli ve taze yağ oranına sahip yerli mahsul."
  },
  {
    "badge": "Odun Ateşinde",
    "origin": "Antakya • Defne",
    "description": "Şeker veya glikoz eklenmeden, sadece nar suyuyla kıvam aldırılmış."
  },
  {
    "badge": "Doğal Kurutma",
    "origin": "Denizli • Honaz",
    "description": "İçi lokum kıvamında, güneşte doğal kurutulmuş mevsimlik atıştırmalık."
  },
  {
    "badge": "Günlük Mandıra",
    "origin": "Afyonkarahisar • Çay",
    "description": "Geleneksel yöntemle sağılan manda sütünden kalın tabakalı lezzet."
  }
];

export const demoReviews = [
  {
    "name": "Selin Çetinkaya",
    "quote": "\"Hatay taş baskı zeytinyağı ve Kars eski kaşarını sipariş ettik. Paketleme tek kelimeyle muazzamdı; cam şişeler özel hava yastıklı kutularda sıfır hasarla ulaştı. Yağın genizde bıraktığı o meyvemsi yakıcılık tam aradığımız kalitede.\"",
    "initials": "SÇ"
  },
  {
    "name": "Murat Yılmaz",
    "quote": "\"Trabzon yayık tereyağı geldiğinde çocukluğumda köyde yediğim tereyağının kokusunu aldım. Erittiğinizde köpük köpük oluyor ve asla ağırlaşmıyor. Salçaları da tam güneşte kurutulmuş köy salçası. Teşekkürler!\"",
    "initials": "MY"
  },
  {
    "name": "Berna Gündoğdu",
    "quote": "\"Ham karakovan çam balının aroması inanılmaz yoğun. Soğuk zincir kargo ile gönderdikleri peynirler buz aküleri dahi erimeden ertesi gün elimize geçti. Artık marketten kahvaltılık almayı tamamen bıraktık.\"",
    "initials": "BG"
  }
];
