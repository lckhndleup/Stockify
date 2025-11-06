# Envantra Renk Paleti

## 🎯 Ana Renkler

### Primary (Ana Kırmızı)

- `primary-500: #E3001B` - Aktif buton/tab rengi
- `primary-600: #dc2626` - Hover durumu
- `primary-700: #b91c1c` - Pressed durumu

### Secondary (Gri Tonları)

- `secondary-50: #F4F7FB` - Aktif olmayan buton/tab arka planı
- `secondary-100: #e2e8f0` - Açık gri yüzeyler

## 🖼️ Yüzey Renkleri

### Surface

- `surface-primary: #FFFFFF` - Ana yüzey (beyaz)
- `surface-secondary: #F4F7FB` - İkincil yüzey
- `surface-tertiary: #f8fafc` - Üçüncül yüzey

### Border

- `border-light: #ECECEC` - Input border rengi
- `border-default: #e2e8f0` - Varsayılan border
- `border-dark: #cbd5e1` - Koyu border

## 📝 Metin Renkleri

### Text

- `text-primary: #1e293b` - Ana metin rengi
- `text-secondary: #73767A` - Aktif olmayan text rengi
- `text-tertiary: #6D706F` - İkon ve işaret renkleri
- `text-inverse: #FFFEFF` - Başlık renkleri (beyaza yakın)
- `text-white: #FFFFFF` - Beyaz metin

## 🎪 Semantic Renkler

### Success (Başarı)

- `success-500: #22c55e` - Yeşil

### Warning (Uyarı)

- `warning-500: #f59e0b` - Turuncu

### Danger (Hata)

- `danger-500: #ef4444` - Kırmızı

### Info (Bilgi)

- `info-500: #3b82f6` - Mavi

## 🎛️ Interactive States

### Interactive

- `interactive-active: #E3001B` - Aktif durum
- `interactive-inactive: #F4F7FB` - Pasif durum
- `interactive-hover: #dc2626` - Hover durum
- `interactive-pressed: #b91c1c` - Basılı durum
- `interactive-disabled: #e2e8f0` - Devre dışı durum

## 💡 Kullanım Örnekleri

```typescript
// Primary Button
<Button variant="primary">Aktif Buton</Button>
// Renk: bg-primary-500 (#E3001B)

// Secondary Button
<Button variant="secondary">Pasif Buton</Button>
// Renk: bg-secondary-50 (#F4F7FB)

// Text Renkleri
<Typography color="text-primary">Ana Metin</Typography>    // #1e293b
<Typography color="text-secondary">İkincil Metin</Typography> // #73767A
<Typography color="text-inverse">Başlık</Typography>        // #FFFEFF

// Input Border
<Input className="border-border-light" />  // #ECECEC

// İkonlar
<Icon color="#6D706F" />  // text-tertiary rengi
```

## 🎨 Design System Uyumluluğu

Bu renk paleti, screenshot'taki modern ve temiz tasarım dilini yansıtır:

- ✅ Ana kırmızı renk (#E3001B) brand identity
- ✅ Neutral gri tonları clean appearance
- ✅ Yeterli kontrast oranları accessibility
- ✅ Consistent naming convention developer experience
- ✅ Semantic color usage user understanding

## 🚀 Yeni Renk Ekleme

Yeni renk eklemek için `tailwind.config.js` dosyasını güncelle:

```javascript
colors: {
  // Yeni semantic renk
  newColor: {
    50: '#....',
    500: '#....',
    600: '#....',
  }
}
```
