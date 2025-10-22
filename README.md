# DermaAssistAI

DermaAssistAI, yapay zeka destekli cilt hastalıkları teşhis sistemidir. OpenAI GPT-5-mini ve Google Gemini-2.5-flash modellerini kullanarak cilt lezyonlarını analiz eder ve teşhis önerileri sunar.

## 🚀 Özellikler

- **AI Destekli Teşhis**: OpenAI ve Gemini modellerini kullanarak cilt lezyonu analizi
- **Hasta Yönetimi**: Hasta bilgileri ve vaka geçmişi yönetimi
- **Rapor Oluşturma**: PDF formatında teşhis raporları
- **Admin Paneli**: Sistem yönetimi ve istatistikler
- **Modern UI**: React + TypeScript + Tailwind CSS ile responsive tasarım

## 📋 Gereksinimler

- **Node.js** 18+
- **PostgreSQL** veritabanı (Neon Database önerilir)
- **OpenAI API Key** (GPT-5-mini model erişimi için)
- **Gemini API Key** (Google AI Studio'dan alınabilir)

## 🛠 Kurulum

### 1. Projeyi İndirin

```bash
git clone https://github.com/srgnunlu/dermaai.git
cd dermaai
```

### 2. Dependencies Yükleyin

```bash
npm install
```

### 3. Environment Variables Ayarlayın

`.env.example` dosyasını `.env` olarak kopyalayın ve değerlerinizi girin:

```bash
cp .env.example .env
```

Gerekli environment variables:

```env
# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://username:password@hostname:5432/database_name?sslmode=require

# AI API Keys
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here

# Server Configuration
PORT=5000
NODE_ENV=development
SESSION_SECRET=your_random_session_secret

# File Upload
UPLOAD_DIR=./uploads

# Admin Email (ilk admin kullanıcı)
ADMIN_EMAIL=admin@yourdomain.com
```

### 4. Veritabanını Hazırlayın

```bash
# Database schema'yı push edin
npm run db:push
```

### 5. Uygulamayı Başlatın

**Development:**

```bash
npm run dev
```

**Production Build:**

```bash
npm run build
npm start
```

Uygulama `http://localhost:3000` adresinde çalışacaktır.

## 🔑 API Keys Nasıl Alınır

### OpenAI API Key

1. [OpenAI Platform](https://platform.openai.com) hesabınızla giriş yapın
2. API Keys bölümünden yeni bir key oluşturun
3. GPT-5-mini model erişiminiz olduğundan emin olun

### Gemini API Key

1. [Google AI Studio](https://aistudio.google.com) hesabınızla giriş yapın
2. API key oluşturun
3. Gemini-2.5-flash model erişiminiz olduğundan emin olun

### Neon Database

1. [Neon](https://neon.tech) hesabınızla giriş yapın
2. Yeni bir PostgreSQL database oluşturun
3. Connection string'i `.env` dosyasına ekleyin

## 🏗 Deployment (Kendi Sunucunuzda)

### Docker ile Deployment

1. **Dockerfile oluşturun:**

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Dependencies
COPY package*.json ./
RUN npm ci --only=production

# Application code
COPY . .

# Build
RUN npm run build

# Upload directory
RUN mkdir -p uploads/images

EXPOSE 3000

CMD ["npm", "start"]
```

2. **Docker Image Build:**

```bash
docker build -t derma-assist-ai .
docker run -p 3000:3000 --env-file .env derma-assist-ai
```

### VPS Deployment

1. **Sunucunuza bağlanın:**

```bash
ssh user@your-server-ip
```

2. **Node.js ve PM2 yükleyin:**

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2
```

3. **Projeyi transfer edin:**

```bash
scp -r DermaAssistAI user@your-server-ip:/var/www/
```

4. **Dependencies ve build:**

```bash
cd /var/www/DermaAssistAI
npm install
npm run build
```

5. **PM2 ile başlatın:**

```bash
pm2 start npm --name "derma-assist" -- start
pm2 startup
pm2 save
```

## 🔧 Geliştirme

### Proje Yapısı

```
DermaAssistAI/
├── client/              # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── components/  # React bileşenleri
│   │   ├── pages/       # Sayfa bileşenleri
│   │   └── hooks/       # Custom hooks
├── server/              # Backend (Express + TypeScript)
│   ├── db.ts           # Database connection
│   ├── routes.ts       # API routes
│   ├── openai.ts       # OpenAI integration
│   ├── gemini.ts       # Gemini integration
│   └── localFileStorage.ts # File storage
├── shared/              # Ortak tip tanımları
└── uploads/            # Yüklenen dosyalar
```

### Komutlar

```bash
npm run dev          # Development server
npm run build        # Production build
npm run check        # TypeScript kontrolü
npm run db:push      # Database schema update
```

## 🔐 Güvenlik

- **Environment Variables**: Tüm hassas bilgiler `.env` dosyasında tutulur
- **File Upload**: Dosya yükleme güvenlik kontrolleri mevcut
- **Session Management**: PostgreSQL tabanlı session yönetimi
- **Authentication**: Local auth sistemi (production'da daha güçlü auth önerilir)

## 🆘 Sorun Giderme

### Yaygın Sorunlar

1. **Database Connection Error:**
   - DATABASE_URL'nin doğru olduğundan emin olun
   - Neon database'in aktif olduğunu kontrol edin

2. **API Key Errors:**
   - OpenAI ve Gemini API key'lerinizin geçerli olduğunu kontrol edin
   - Rate limits'e takılmadığınızdan emin olun

3. **File Upload Issues:**
   - `uploads/` klasörünün yazma izinleri olduğunu kontrol edin
   - UPLOAD_DIR path'inin doğru olduğundan emin olun

### Loglar

```bash
# PM2 logları
pm2 logs derma-assist

# Development logları
npm run dev
```

## 📝 Lisans

MIT License

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📞 Destek

Sorunlarınız için GitHub Issues kullanabilirsiniz.

---

**Not**: Bu sistem eğitim/demo amaçlıdır. Gerçek tıbbi teşhis için mutlaka uzman doktor görüşü alınmalıdır.
