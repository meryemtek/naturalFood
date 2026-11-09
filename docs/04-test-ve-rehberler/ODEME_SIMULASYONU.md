# Ödeme simülasyonu

Bu modül gerçek ödeme yapmaz, kart bilgisi kabul etmez ve siparişi ödenmiş duruma getirmez. Rezervasyon normal süresi dolduğunda sona erer. Yalnızca geliştirme ortamında ve `Payments__Simulation__Enabled=true` ile açılır. Sipariş oluşturmak için ayrıca `Checkout__Enabled`, `Checkout__ShippingFee`, `Checkout__FreeShippingThreshold` ve `Checkout__ReservationMinutes` yapılandırılmalıdır. Gerçek işlem değerleri belirlenmeden bu ayarlar varsayılmaz.

`POST /api/orders/{orderId}/simulated-payments/` isteğine `Idempotency-Key` başlığı ve `{"result":"Success"}` veya `{"result":"Failure"}` gövdesi gönderilir. Müşteri JWT'si veya siparişin `X-Guest-Cart-Token` değeri gerekir. Tutar siparişten alınır. Aynı anahtarla aynı sonuç tekrarlandığında önceki kayıt döner; farklı sonuç 409 döndürür. Yanıttaki `isSimulation` alanı her zaman `true` değerindedir.

`GET /api/orders/{orderId}/simulated-payments/{paymentId}` aynı yetkilendirmeyle simülasyon kaydını getirir. Üretim ortamında bu uçlar 404 döndürür. Ödeme sağlayıcısı ve gerçek ödeme onayı ayrıca geliştirilmelidir.
