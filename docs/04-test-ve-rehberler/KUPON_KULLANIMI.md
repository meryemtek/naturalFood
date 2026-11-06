# Kupon kullanımı

`PUT /api/cart/coupon` isteğine `{"code":"KOD"}` gönderilir; `DELETE /api/cart/coupon` kuponu kaldırır. Üye JWT'si veya misafir için `X-Guest-Cart-Token` gereklidir. Sepet yanıtında `couponCode`, `discount`, `total` ve geçersizleşen kupon için `couponError` döner. `total` ürünlerin indirim sonrası toplamıdır; kargo sipariş sırasında hesaplanır.

Kod büyük harfle saklanır. Kupon başlangıç ve bitiş zamanı, aktiflik, limit, minimum sepet tutarı ve varsa ürün/kategori kapsamı sunucuda kontrol edilir. Kategori kapsamına etkin alt kategoriler dahildir. Sabit indirim uygun ürünlerin tutarını aşamaz. Sipariş oluştururken indirim ve kullanım limiti yeniden kontrol edilir; başarılı rezervasyon kullanım hakkını ayırır, ödenmeyen siparişin rezervasyonu sona erdiğinde hak iade edilir.

`ICouponCreationService` yeni kupon oluşturmak için doğrulamalı servis sözleşmesidir. Yetkisiz kupon oluşturmaya izin verilmemesi ve admin alanının ayrı ekip tarafından yürütülmesi için bu servis bir HTTP endpointi olarak açılmamıştır; yönetim entegrasyonu yetkilendirmeyle ayrıca bağlanmalıdır.
