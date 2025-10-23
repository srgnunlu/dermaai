# Dermatolog Blind Review Sistemi - Kurulum Kılavuzu

## Genel Bakış
Bu sistem, dermatologlara AI analizleri görmeden (blind review) vakaları inceleme ve tanı koyma imkanı sağlar. Bu sayede AI tahminleri ile dermatolog tanıları karşılaştırılabilir.

## Yapılan Değişiklikler

### 1. Database Schema Güncellemeleri
Aşağıdaki alanlar `cases` tablosuna eklendi:

```typescript
dermatologistDiagnosis: text('dermatologist_diagnosis')
dermatologistNotes: text('dermatologist_notes')
dermatologistDiagnosedBy: varchar('dermatologist_diagnosed_by').references(() => users.id)
dermatologistDiagnosedAt: timestamp('dermatologist_diagnosed_at')
```

### 2. Backend API Endpoints

#### `/api/dermatologist/cases` (GET)
- Sadece admin kullanıcılar erişebilir
- Tüm tamamlanmış vakaları AI analizi olmadan döndürür (blind review)
- Gemini ve OpenAI analiz sonuçları gizlenir

#### `/api/cases/:id/dermatologist-diagnosis` (POST)
- Sadece admin kullanıcılar erişebilir
- Dermatolog tanısını kaydeder
- Request body:
  ```json
  {
    "dermatologistDiagnosis": "string (required)",
    "dermatologistNotes": "string (optional)"
  }
  ```

### 3. Frontend Sayfası
**Yeni Sayfa:** `/dermatologist`
- Sadece admin kullanıcılar erişebilir
- Vakaları AI analizi olmadan listeler
- Her vaka için tanı girme formu
- Daha önce girilen tanıları görüntüleme ve düzenleme
- Responsive ve modern UI

### 4. CSV Export Güncellemesi
Admin panel CSV export'una şu alanlar eklendi:
- Dermatolog Tanısı
- Dermatolog Notları
- Tanı Tarihi

### 5. Admin Panel Güncellemesi
Case Details modal'ında dermatolog tanısı gösterimi eklendi.

## Veritabanı Migration

### Gerekli SQL Migration

Projenizi production'da çalıştırırken aşağıdaki SQL migration'ı uygulamanız gerekir:

```sql
-- Add dermatologist diagnosis columns to cases table
ALTER TABLE cases 
ADD COLUMN dermatologist_diagnosis TEXT,
ADD COLUMN dermatologist_notes TEXT,
ADD COLUMN dermatologist_diagnosed_by VARCHAR REFERENCES users(id),
ADD COLUMN dermatologist_diagnosed_at TIMESTAMP;
```

**ÖNEMLİ:** Development ortamında Drizzle ORM kullanıyorsanız:

```bash
# Development ortamında uygulama çalıştırıldığında
# Drizzle otomatik olarak schema değişikliklerini algılayacak
# ve gerekli migration'ları uygulayacaktır

# Ya da manuel olarak:
npx drizzle-kit push
```

## Kullanım

### Dermatolog İçin
1. Admin olarak giriş yapın
2. Header'dan "Dermatologist Review" linkine tıklayın
3. Sol tarafta vakalar listelenir (AI analizi olmadan)
4. Bir vakaya tıklayın
5. Hasta bilgilerini ve görselleri inceleyin
6. Tanı ve notlarınızı girin
7. "Save Diagnosis" butonuna tıklayın

### Admin İçin
1. Admin panel'de vakaları görüntülerken dermatolog tanıları gösterilir
2. CSV export'unda dermatolog tanıları da yer alır
3. AI tahminleri ile dermatolog tanıları karşılaştırılabilir

## Güvenlik
- Tüm endpoint'ler `requireAdmin` middleware ile korunmuştur
- Sadece admin kullanıcılar dermatolog paneline erişebilir
- Dermatolog tanıları veritabanında kullanıcı ID'si ile ilişkilendirilir

## Blind Review Özelliği
Sistem, dermatologların AI'dan etkilenmemesi için:
- Gemini analysis sonuçlarını gizler
- OpenAI analysis sonuçlarını gizler
- Final diagnoses'i gizler
- Sadece hasta bilgilerini ve görselleri gösterir

Bu sayede AI ile dermatolog tanıları bağımsız olarak karşılaştırılabilir.

## Test Edilmesi Gereken Alanlar
1. ✅ Dermatologist page erişimi (sadece admin)
2. ✅ Vaka listesinin AI analizleri olmadan yüklenmesi
3. ✅ Tanı kaydetme işlemi
4. ✅ Tanı düzenleme işlemi
5. ✅ Admin panel'de tanıların görünümü
6. ✅ CSV export'unda dermatolog tanıları
7. ⚠️ Database migration (production'da manuel olarak uygulanmalı)

## İleriye Dönük Geliştirmeler
- [ ] Dermatolog performans metrikleri (doğruluk oranı, vs.)
- [ ] AI-Dermatolog agreement rate analizi
- [ ] Multiple dermatologist consensus sistemi
- [ ] Dermatolog feedback sistemi AI model iyileştirme için

