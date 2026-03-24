# PRO-KOM Serwis — System zarządzania serwisem elektroniki

## 🚀 Opis projektu

PRO-KOM Serwis to kompleksowa platforma operacyjna klasy premium dla serwisu elektroniki w Rabce-Zdroju.

### Składa się z:
- **Strony publicznej** (SEO, formularze, wizytówka premium)
- **Panelu klienta** (śledzenie napraw, wiadomości, wyceny)
- **Panelu staff** (zarządzanie naprawami, workflow)
- **Panelu admina** (KPI, statystyki, zarządzanie)
- **API Django REST** (backend)

---

## 🏗️ Struktura projektu

```
prokom-system/
├── backend/       # Django REST API
├── frontend/      # Next.js + React + TypeScript
├── docs/          # Dokumentacja
├── infra/         # Pliki infrastrukturalne (docker, render)
├── .gitignore
└── README.md
```

---

## ⚙️ Stack technologiczny

### Backend
- Python 3.14 + Django 5.1
- Django REST Framework
- PostgreSQL
- Celery + Redis
- Render (hosting)

### Frontend
- Next.js 14 + React + TypeScript
- Tailwind CSS
- Render (hosting)

---

## 🛠️ Uruchomienie lokalne

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

---

## 🌿 Branch strategy

- `main` — produkcja
- `develop` — integracja / staging
- `feature/...` — nowe funkcje
- `fix/...` — poprawki
- `hotfix/...` — krytyczne poprawki

---

## 📋 Etapy budowy

1. ✅ Fundament (repo, backend, settings, User)
2. ✅ Modele (clients, devices, repairs)
3. ✅ API (auth, lista/szczegóły/tworzenie napraw, public submit)
4. ✅ Panel staff (dashboard, szybkie akcje, timeline)
5. ✅ Panel klienta (profil, naprawy, wiadomości, wycena, status)
6. ✅ Wyceny i części (pricing, inventory, cost-summary)
7. ⏳ Hammer Glass, akcesoria, upselle
8. ⏳ Komunikacja (e-mail, SMS, szablony)
9. ⏳ Dokumenty (PDF, QR, etykiety)
10. ⏳ RODO i backup
11. ⏳ Analytics i KPI (dashboard admina)

Szczegóły: [docs/ANALIZA_STANU_PROJEKTU.md](docs/ANALIZA_STANU_PROJEKTU.md)
