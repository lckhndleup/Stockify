# Stockify

**Kuruyemiş Üretim Firmaları İçin Stok Takip ve Satış Yönetim Uygulaması**

## Proje Hakkında

Stockify, kuruyemiş üretimi yapan firmalar için özel olarak geliştirilmiş kapsamlı bir stok takip ve satış yönetim uygulamasıdır. Uygulama, ürün stoklarından aracı yönetimine, satış süreçlerinden tahsilata kadar işletmenin tüm operasyonel ihtiyaçlarını karşılamak üzere tasarlanmıştır.

### Ana Amaç

Kuruyemiş üretici firmalarının stok yönetimi, aracı satışları ve finansal takip süreçlerini dijitalleştirerek operasyonel verimlilik sağlamak ve kayıt tutma süreçlerini modernize etmek.

## Özellikler

### 🍯 Ürün Yönetimi

- **Kategorili Ürün Sistemi**: Kuruyemiş, çerez, baharat, kuru meyve kategorileri
- **Detaylı Ürün Bilgileri**: Ad, kategori, stok adedi, adet fiyatı
- **Stok Seviye Takibi**: Normal, kritik (≤50 adet) ve tükenen ürün durumları
- **Aktif/Pasif Ürün Durumları**: Ürünleri geçici olarak pasife alma
- **Stok Değer Hesaplaması**: Toplam stok değeri otomatik hesaplama
- **Stok Hareket Geçmişi**: Tüm giriş-çıkış hareketlerinin kaydı

### 👥 Aracı Yönetimi

- **Aracı Profilleri**: Ad, soyad ve kişisel bilgiler
- **İskonto Sistemi**: Her aracı için özelleştirilebilir iskonto oranları (%0-100)
- **Bakiye Takibi**: Aracıların güncel borç/alacak durumu
- **Makbuz Sistemi**: Aracı bazında makbuz durumu takibi
- **Transaction Geçmişi**: Tüm satış ve tahsilat hareketlerinin detaylı kaydı

### 💰 Satış Yönetimi

- **Aracılara Ürün Satışı**: Stoktan aracılara ürün verme işlemi
- **Otomatik İskonto Hesaplama**: Aracı bazında iskonto uygulaması
- **Stok Kontrolü**: Yetersiz stok durumunda uyarı sistemi
- **Fiyat Hesaplaması**: Brüt tutar, iskonto tutarı ve net tutar hesaplama
- **Satış Doğrulama**: Onay mekanizması ile hatalı satışları önleme
- **Satış Fişi**: Anlık satış fişi oluşturma ve yazdırma özelliği
- **Satış Sonuç Ekranı**: Başarılı işlemler için animasyonlu geri bildirim

### 📊 Stok Takip Sistemi

- **Gerçek Zamanlı Stok Durumu**: Anlık stok seviyelerini görüntüleme
- **Kritik Stok Uyarıları**: Düşük stok seviyesinde otomatik uyarılar
- **Stok İstatistikleri**: Toplam değer, kritik ürün sayısı, tükenen ürünler
- **Manuel Stok Güncellemesi**: Stok düzeltmeleri ve sebep belirtme
- **Stok Hareket Raporları**: Detaylı giriş-çıkış raporu

### 🧾 Tahsilat Yönetimi

- **Aracılardan Tahsilat**: Nakit ve diğer ödeme türleri ile tahsilat
- **Bakiye Güncellemesi**: Otomatik bakiye hesaplama ve güncelleme
- **Tahsilat Geçmişi**: Tüm tahsilat işlemlerinin kayıt altına alınması
- **Ödeme Türü Takibi**: Farklı ödeme yöntemlerinin ayrı takibi

### 🎨 Modern Kullanıcı Arayüzü

- **Responsive Tasarım**: Tüm ekran boyutlarında uyumlu görünüm
- **Tutarlı Design System**: Profesyonel ve modern tasarım dili
- **Kolay Navigasyon**: Alt menü ile hızlı sayfa geçişleri
- **Görsel Göstergeler**: Renk kodlaması ile durum belirleme
- **Kullanıcı Dostu Formlar**: Kolay veri girişi ve doğrulama

## Teknolojiler

### Frontend Framework

- **React Native**: Cross-platform mobil uygulama geliştirme
- **Expo**: Geliştirme ve deployment platformu
- **TypeScript**: Statik tip kontrolü ve kod kalitesi

### State Management

- **Zustand**: Basit ve performanslı state yönetimi
- **AsyncStorage**: Yerel veri saklama ve persistence

### UI/UX

- **TailwindCSS**: Utility-first CSS framework
- **NativeWind**: React Native için TailwindCSS entegrasyonu
- **Montserrat Font**: Modern ve okunabilir tipografi
- **Expo Vector Icons**: Kapsamlı ikon kütüphanesi

### Navigation & Routing

- **Expo Router**: File-based routing sistemi
- **React Navigation**: Native navigation deneyimi

### Form & Validation

- **React Hook Form**: Performanslı form yönetimi
- **Zod**: Runtime şema doğrulaması
- **Custom Validation**: İş mantığına özel doğrulama kuralları

### Development Tools

- **ESLint**: Kod kalitesi ve standartları
- **Prettier**: Kod formatlama
- **TypeScript**: Static type checking

## Kurulum

### Gereksinimler

- Node.js (v16 veya üzeri)
- npm veya yarn
- Expo CLI
- Android Studio (Android development için)
- Xcode (iOS development için)

### Adım Adım Kurulum

1. **Projeyi klonlayın:**

   ```bash
   git clone [repository-url]
   cd stockify
   ```

2. **Bağımlılıkları yükleyin:**

   ```bash
   npm install
   # veya
   yarn install
   ```

3. **Uygulamayı başlatın:**

   ```bash
   npx expo start
   ```

4. **Platform seçimi:**
   - `a` - Android emülatör/cihazda açmak için
   - `i` - iOS simulator/cihazda açmak için
   - `w` - Web browser'da açmak için

## Proje Yapısı

```
stockify/
├── .expo/                        # Expo konfigürasyonları
├── .vscode/                      # VSCode ayarları
├── app/                          # Expo Router sayfaları
│   ├── _layout.tsx               # Root layout
│   ├── login.tsx                 # Giriş sayfası
│   ├── index.tsx                 # Ana sayfa (dashboard)
│   ├── brokers.tsx               # Aracılar listesi
│   ├── products.tsx              # Ürünler sayfası
│   ├── stock.tsx                 # Stok takip sayfası
│   └── broker/                   # Aracı detay grubu
│       ├── brokerDetail.tsx      # Aracı detay sayfası
│       └── sections/             # Aracı işlem sayfaları
│           ├── salesSection.tsx      # Satış işlemleri
│           ├── confirmSales.tsx      # Satış onay ekranı
│           ├── resultSales.tsx       # Satış sonuç ekranı
│           ├── collectionSection.tsx # Tahsilat işlemleri
│           ├── statementSection.tsx  # Ekstre sayfası
│           └── invoiceSection.tsx    # Fatura sayfası
├── src/                          # Ana kaynak dosyalar
│   ├── components/               # React bileşenleri
│   │   ├── common/               # Ortak bileşenler
│   │   │   ├── FontProvider.tsx  # Font yönetimi
│   │   │   └── Providers.tsx     # Global provider'lar
│   │   ├── svg/                  # SVG bileşenleri
│   │   └── ui/                   # UI kütüphanesi
│   │       ├── index.tsx         # UI export dosyası
│   │       ├── bottomnavigation.tsx
│   │       ├── bottomsheet.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── checkbox.tsx
│   │       ├── container.tsx
│   │       ├── debugPanel.tsx
│   │       ├── divider.tsx
│   │       ├── icon.tsx
│   │       ├── input.tsx
│   │       ├── loading.tsx
│   │       ├── modal.tsx
│   │       ├── searchbar.tsx
│   │       ├── selectbox.tsx
│   │       ├── squareCard.tsx
│   │       ├── tab.tsx
│   │       ├── toast.tsx
│   │       └── typography.tsx
│   ├── docs/                     # Dokümantasyon
│   │   └── color-palette.md      # Renk paleti rehberi
│   ├── hooks/                    # Custom React hooks
│   │   ├── useLanguageLoader.ts  # Dil yükleme hook'u
│   │   └── useToast.tsx          # Toast notification hook'u
│   ├── locales/                  # Çoklu dil desteği
│   │   ├── en.json               # İngilizce çeviriler
│   │   └── tr.json               # Türkçe çeviriler
│   ├── services/                 # API ve servis katmanı
│   │   └── api.ts                # API service yapılandırması
│   ├── stores/                   # Zustand state management
│   │   ├── appStore.ts           # Ana uygulama state'i
│   │   ├── authStore.ts          # Authentication state'i
│   │   └── useLangStore.ts       # Dil tercihi state'i
│   ├── types/                    # TypeScript tip tanımları
│   ├── utils/                    # Yardımcı fonksiyonlar
│   │   └── i18n.ts               # Uluslararasılaştırma ayarları
│   └── validations/              # Form doğrulama şemaları
│       └── salesValidation.ts    # Satış form validasyonları
├── node_modules/                 # NPM bağımlılıkları
├── .gitignore                    # Git ignore kuralları
├── app.json                      # Expo app konfigürasyonu
├── babel.config.js               # Babel konfigürasyonu
├── expo-env.d.ts                 # Expo tip tanımları
├── global.css                    # Global CSS stilleri
├── nativewind-env.d.ts           # NativeWind tip tanımları
├── package.json                  # NPM paket tanımları
├── tailwind.config.js            # TailwindCSS konfigürasyonu
├── tsconfig.json                 # TypeScript konfigürasyonu
└── README.md                     # Proje dokümantasyonu
```

## Kullanım Kılavuzu

### 1. Giriş Yapma

- Kullanıcı adı ve şifre ile sistem girişi
- "Beni hatırla" seçeneği ile otomatik giriş
- Güvenli oturum yönetimi

### 2. Ürün Yönetimi

- **Ürün Ekleme**: Kategori seçimi, ad, stok adedi ve fiyat girişi
- **Ürün Düzenleme**: Mevcut ürün bilgilerini güncelleme
- **Stok Takibi**: Kritik seviyedeki ürünleri görüntüleme
- **Ürün Silme**: Ürünleri pasife alma (kalıcı silme yerine)

### 3. Aracı Yönetimi

- **Aracı Ekleme**: Ad, soyad ve iskonto oranı tanımlama
- **Bakiye Görüntüleme**: Aracının güncel borç durumunu kontrol
- **İskonto Ayarlama**: Her aracı için özel iskonto oranları
- **Makbuz Durumu**: Aracı bazında makbuz takibi

### 4. Satış İşlemleri

- **Ürün Seçimi**: Mevcut ürünlerden seçim yapma
- **Miktar Belirleme**: Verilecek ürün adedini girme
- **İskonto Uygulama**: Otomatik iskonto hesaplama
- **Satış Onayı**: İşlemi tamamlama ve stoktan düşme
- **Satış Fişi Oluşturma**: İşlem sonrası detaylı fiş oluşturma
- **Fiş Yazdırma**: Bluetooth yazıcılara fiş gönderme
- **İşlem Sonucu**: Animasyonlu başarı/hata bildirimleri

### 5. Stok Kontrolü

- **Anlık Durum**: Tüm ürünlerin stok durumunu görüntüleme
- **Kritik Uyarılar**: Düşük stoklu ürünlerin listesi
- **Stok Güncelleme**: Manuel stok düzeltmeleri
- **Hareket Geçmişi**: Stok giriş-çıkış raporları

### 6. Tahsilat İşlemleri

- **Tahsilat Girişi**: Aracıdan alınan ödeme tutarı
- **Ödeme Türü**: Nakit, havale gibi ödeme yöntemleri
- **Bakiye Güncelleme**: Otomatik borç düşme
- **Tahsilat Geçmişi**: Ödeme kayıtları

## Konfigürasyon

### Renk Paleti (tailwind.config.js)

```javascript
colors: {
  'stock-red': '#E3001B',      // Ana marka rengi
  'stock-green': '#0a7029',    // Pozitif durumlar
  'stock-gray': '#F4F7FB',     // Arka plan ve pasif durumlar
  'stock-white': '#FFFEFF',    // Beyaz tonlar
  'stock-black': '#222222',    // Koyu metinler
  'stock-border': '#ECECEC',   // Kenarlıklar
  'stock-text': '#73767A',     // İkincil metinler
  'stock-dark': '#67686A'      // Üçüncül metinler
}
```

### Font Konfigürasyonu

- **Ana Font**: Montserrat
- **Ağırlıklar**: 400 (Normal), 500 (Medium), 600 (SemiBold), 700 (Bold)
- **Responsive**: Tüm ekran boyutlarında optimize edilmiş

### AsyncStorage Anahtarları

- `stockify-app-store`: Ana uygulama verisi
- `stockify-auth`: Kimlik doğrulama bilgileri
- `stockify-language`: Dil tercihleri

## Geliştirme

### Development Server

```bash
npx expo start
```

### Build İşlemleri

```bash
# Android APK
npx expo build:android

# iOS IPA
npx expo build:ios

# Development build
eas build --profile development
```

### Debugging

- **Expo DevTools**: Web tabanlı debugging araçları
- **React Native Debugger**: Gelişmiş debugging özellikleri
- **Console Logging**: Detaylı log sistemi

## Güvenlik

- **Kimlik Doğrulama**: JWT token tabanlı güvenli giriş
- **Veri Şifreleme**: AsyncStorage'da güvenli veri saklama
- **Input Validation**: Zod ile form doğrulama
- **Error Handling**: Kapsamlı hata yönetimi

## Performans Optimizasyonları

- **Lazy Loading**: Sayfa bazında kod bölme
- **State Management**: Zustand ile optimize edilmiş state yönetimi
- **Image Optimization**: Expo Image ile performanslı resim yükleme
- **Memory Management**: Efficent rendering ve cleanup

## Gelecek Planları

### v2.0 Özellikleri

- [x] Satış fişi yazdırma sistemi
- [ ] Fatura ve makbuz otomasyonu
- [ ] Gelişmiş raporlama modülü
- [ ] Çoklu kullanıcı desteği
- [ ] Web dashboard entegrasyonu
- [ ] Barkod sistemi entegrasyonu
- [ ] Cloud backup ve senkronizasyon

### v2.1 İyileştirmeler

- [ ] Offline çalışma desteği
- [ ] Push notification sistemi
- [ ] İleri düzey filtreleme
- [ ] Export/Import özellikleri
- [ ] Multi-language support

## Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## İletişim

**Geliştirici**: [İsim]
**Email**: [email@example.com]
**Proje URL**: [GitHub Repository URL]

## Lisans

Bu proje MIT lisansı ile lisanslanmıştır. Detaylar için `LICENSE` dosyasına bakınız.

---

**Stockify** - Kuruyemiş sektörüne özel, modern ve kullanıcı dostu stok yönetim çözümü.

_Son Güncelleme: 4 Eylül 2025_
