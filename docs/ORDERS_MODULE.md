# Moduł Zamówienia i zaopatrzenie (Orders)

Moduł **tylko dla administratorów**. Służy do obsługi:
- **Zamówień klientów** — produkt pod konkretnego klienta (od zapisu do odbioru)
- **Zaopatrzenia sklepu** — braki, lista do zamówienia

Połączony z: **klientami** (clients), **hurtowniami** (inventory.Supplier), **naprawami** (related_repair), **katalogiem produktów** (OrderProduct).

---

## Modele

### OrderProductCategory
Kategoria produktów (np. ładowarki, kable, etui). Pola: `name`, `sort_order`, `is_active`.

### OrderProduct
Produkt w katalogu zamówień. Pola: `name`, `ean` (opcjonalnie), `category`, `brand`, `product_type`, `notes`, `is_active`.  
Historia użycia i historia cen wynikają z powiązań z CustomerOrder i StoreSupplyOrder.

### CustomerOrder (Zamówienie klienta)
- Klient (FK, opcjonalnie), telefon/e-mail kontaktowy
- Produkt (FK OrderProduct lub `product_name_override` / API: `product_name_manual`)
- **related_repair** (FK do naprawy) — produkt z naprawy
- Ilość, cena zakupu, cena sprzedaży; **margin** i **margin_percent** (liczone automatycznie)
- Hurtownia, planowana data zamówienia, przewidywana data dotarcia
- Status: new, to_order, ordered, in_transit, arrived, client_notified, ready_for_pickup, picked_up, cancelled
- Zaliczka, czy klient poinformowany, data odbioru (picked_up_at)
- Flagi: deposit_paid, urgent, client_waiting, requires_contact, overdue

### StoreSupplyOrder (Zaopatrzenie sklepu)
- Produkt (FK, opcjonalnie) lub **product_name_manual** — szybkie dodawanie braku bez katalogu
- Ilość, hurtownia, szacowany koszt
- Priorytet: low, standard, high, urgent
- Status: to_order, ordered, in_transit, arrived, restocked, cancelled

---

## API (tylko admin)

Baza: **/api/v1/orders/**

| Endpoint | Opis |
|---------|------|
| GET/POST /categories/ | Kategorie produktów |
| GET/POST /products/ | Katalog produktów (filtry: category, brand, product_type); pole **ean** |
| GET /products/autocomplete/?q=...&category=<uuid> | Podpowiedzi produktów (w tym po EAN) |
| GET /products/<id>/card/ | Karta produktu: historia, ceny, hurtownie, **price_history** (data, cena, hurtownia, ilość) |
| GET/POST /customer-orders/ | Zamówienia klientów; pola **related_repair**, **margin_percent**, **product_name_manual** |
| GET /customer-orders/requires-action/ | Lista zamówień wymagających reakcji |
| GET/POST /store-supply/ | Zaopatrzenie sklepu; **product** lub **product_name_manual** (szybkie dodawanie braków) |
| GET /dashboard/ | Kafelki po statusach + **to_order_today_count**, **total_profit**, **uncollected_count**, **linked_to_repair_count** |
| GET /to-order-today/ | Lista „Do zamówienia dziś” (zamówienia klientów + braki sklepu) |
| GET /by-supplier/ | Grupowanie zamówień po hurtowniach (pozycje + łączny koszt) |

Przy tworzeniu zamówienia klienta i zaopatrzenia pole `created_by` ustawiane jest na zalogowanego admina.

---

## Django Admin

Sekcja **Zamówienia i zaopatrzenie**:
- **Kategorie produktów (zamówienia)** — lista, edycja, sort_order
- **Produkty (zamówienia)** — katalog, filtry po kategorii/marce/typie
- **Zamówienia klientów** — lista z produktem, klientem, cenami, statusem, flagami; filtry po statusie, pilne, poinformowano
- **Zaopatrzenie sklepu** — lista z produktem, ilością, priorytetem, statusem

---

## Karta produktu (GET /products/<id>/card/)

Zwraca:
- `product` — dane produktu
- `customer_order_count`, `store_supply_count`
- `last_purchase_price`, `last_sell_price`, `last_supplier`
- `avg_purchase_price`, `min_purchase_price`, `max_purchase_price`, `avg_sell_price`
- `most_used_supplier`
- `recent_customer_orders`, `recent_supply_orders` — ostatnie pozycje

---

## Uprawnienia

Wszystkie endpointy i widoki admina modułu zamówień sprawdzają **rolę admin**. Staff nie ma dostępu do tego modułu.
