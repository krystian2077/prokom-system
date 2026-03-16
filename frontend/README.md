# PRO-KOM Frontend

## Uruchomienie

**Tryb deweloperski (zalecany):**

```bash
cd frontend
npm install
npm run dev
```

Otwórz w przeglądarce: **http://localhost:3000**

Uruchamiaj **zawsze z folderu `frontend`**. Jeśli na 3000 działa inna aplikacja (inny projekt, live-server), zatrzymaj ją — inaczej zobaczysz 404 dla plików `_next/static/...`.

**Jeśli strona się nie ładuje (biały ekran, 404 dla `_next/static/...`):**

1. Upewnij się, że uruchamiasz z folderu **frontend** (tam jest `package.json` z Next.js).
2. Zatrzymaj serwer (Ctrl+C), wyczyść build i uruchom ponownie:
   ```bash
   npm run dev:clean
   ```
3. Otwórz **http://localhost:3000** (nie plik z dysku).
4. Twarde odświeżenie w przeglądarce: **Ctrl+Shift+R** (Windows) lub **Cmd+Shift+R** (Mac).
5. Na porcie 3000 może działać inna aplikacja — wtedy zatrzymaj ją i uruchom ponownie `npm run dev` z folderu `frontend`.

**Produkcja:**

```bash
npm run build
npm run start
```

Domyślnie strona będzie na http://localhost:3000 (produkcyjny `next start` używa 3000).
