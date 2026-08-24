# Studio Paznokci — Rezerwacja online (Booking App)

Kompletna aplikacja Next.js: landing page salonu + wizard rezerwacji dla
klientów + zaawansowany panel do zarządzania grafikiem, usługami i rezerwacjami
z systemem ról (Właściciel / Pracownik).

## 🚀 Technologie i infrastruktura

Aplikacja przeszła z fazy deweloperskiej na środowisko produkcyjne i aktualnie opiera się na:
- **Framework**: Next.js (App Router) + TypeScript
- **Style**: Tailwind CSS v4 + niestandardowe zmienne CSS dla estetycznego designu
- **Baza danych**: PostgreSQL (hostowana na Supabase) obsługiwana przez Prisma ORM
- **Magazyn plików**: Vercel Blob (zdjęcia pracowników, galeria)
- **Maile**: Resend (wysyłka powiadomień, potwierdzeń i przypomnień)
- **Zadania w tle (Cron)**: Skonfigurowany endpoint dla Vercel Cron do wysyłania przypomnień SMS/e-mail 24h przed wizytą.

## 🛠️ Uruchomienie lokalne

1. **Instalacja zależności**:
   ```bash
   npm install
   ```

2. **Zmienne środowiskowe (`.env`)**:
   Skopiuj `.env.example` do `.env` i uzupełnij klucze:
   - `DATABASE_URL` oraz `DIRECT_URL` (Supabase / Prisma)
   - `BLOB_READ_WRITE_TOKEN` (Vercel Blob)
   - `RESEND_API_KEY` (Klucz API Resend)
   - `JWT_SECRET` (do sesji auth)

3. **Inicjalizacja bazy (opcjonalnie)**:
   ```bash
   npx prisma generate
   ```

4. **Uruchomienie serwera dev**:
   ```bash
   npm run dev
   ```

### Dostępne podstrony:
- Landing page: `http://localhost:3000`
- Rezerwacja klienta: `http://localhost:3000/rezerwacja`
- Panel administracyjny: `http://localhost:3000/panel/login`

## 👥 System kont i uprawnień (Nowość!)

Aplikacja posiada pełen podział na role, egzekwowany bezpiecznie po stronie serwera dzięki tzw. *Route Groups* w Next.js:

1. **Właściciel (`OWNER`)**:
   - Posiada pełen dostęp do wszystkich zakładek (Ustawienia, Galeria, Opinie, Kategorie, Usługi).
   - Zarządza listą pracowników, przypisuje im usługi, oraz tworzy/kasuje ich konta logowania.
   - Zarządza stałymi godzinami pracy (`WorkingHours`) oraz urlopami/wyjątkami (`DayOverrides`) wszystkich osób.
   - Widzi zagregowane statystyki (Zarobki, liczba wizyt) w widoku **Podsumowanie**.

2. **Pracownik (`EMPLOYEE`)**:
   - Loguje się własnym emailem i hasłem stworzonym przez szefową.
   - Po zalogowaniu ma dostęp **tylko** do dwóch zakładek: *Rezerwacje* i *Grafik*.
   - Nie może zmieniać swojego grafiku ani dodawać urlopów (suwaki edycji są dla niego ukryte, a API odrzuca requesty).
   - W widoku rezerwacji **widzi tylko swoje wizyty** (nie widzi wizyt innych pracowników), co zapewnia dyskrecję.

> Próba wpisania z palca urlu (np. `/panel/uslugi`) przez pracownika automatycznie poskutkuje wyrenderowaniem estetycznego komunikatu "Brak dostępu", zabezpieczając panel po stronie serwera. Próba wejścia do panelu bez logowania automatycznie przekierowuje na ekran logowania.

## 📅 Silnik dostępności (Najważniejsza logika)

Moduł dostępności (`src/lib/availability.ts`) odpowiada za bezpieczną i bezkolizyjną rezerwację.

Dla danego pracownika i dnia:
1. Sprawdza, czy jest wyjątek na ten dzień (`DayOverride` — urlop albo zmienione godziny). Jeśli urlop → brak slotów.
2. Jeśli brak wyjątku, bierze stały grafik tygodniowy (`WorkingHour`) dla tego dnia tygodnia.
3. Dzieli okno pracy na sloty co ustaloną liczbę minut (domyślnie 30 min).
4. Automatycznie uwzględnia *łączony czas trwania usług* (klient może wybrać więcej niż jedną usługę na raz – system obliczy sumę minut i zablokuje mniejsze dziury czasowe).
5. Odrzuca sloty kolidujące z istniejącymi, potwierdzonymi rezerwacjami.
6. Przy tworzeniu rezerwacji weryfikuje dostępność po stronie serwera, dzięki czemu niemożliwy jest tzw. podwójny booking (dwóch klientów w tym samym ułamku sekundy).

## ✨ Ostatnio zaimplementowane funkcje
- ✅ Całkowite przebudowanie systemu Auth (każdy pracownik posiada zhashowane własne hasło do logowania)
- ✅ `Hard Delete` pracownika (usunięcie konta kasuje wszystkie powiązane z nim rezerwacje z bazy) z dedykowanym formularzem typu *modal* zamiast systemowego.
- ✅ Widok `Podsumowanie` dla Właściciela do analizy utargów.
- ✅ Wsparcie dla jednoczesnego wyboru wielu usług przez klienta podczas bookingu (koszt i czas są automatycznie sumowane).
- ✅ Atrakcyjny layout panelu administracyjnego (glassmorphism, animacje przejść, interaktywne stany hover).
