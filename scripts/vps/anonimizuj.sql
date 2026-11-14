-- =============================================================================
-- PRO-KOM Tech — anonymize a production DB copy before it is used on STAGING.
-- docs/tech/MIGRACJA-VPS.md §6. PostgreSQL 16. NEVER run against production.
--
-- Usage (staging stack, after restoring the dump):
--   psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f anonimizuj.sql
--
-- Policy:
--   * clients and client user accounts -> klient-<n>@example.test, phone 500xxxxxx,
--     placeholder names/addresses; company data cleared
--   * staff/admin accounts stay (needed to log into the staging panel)
--   * tokens, verification/claim codes, IPs, audit payloads -> removed
--   * free-text fields keep their meaning, but anything that looks like an e-mail
--     or phone number is masked (customers type device passwords and phone numbers
--     into notes); device passwords are cleared
--   * client first/last names inside their repairs' notes -> "Klient Testowy"
--   * outgoing-message log (recipient, body snapshot) is cleared
-- Known residual risk (acceptable behind staging basic auth): names of third
-- parties typed into free text, short PINs ("hasło 1234") and media files
-- (photos/PDFs in the media volume are copied as-is).
-- The script ends with control queries; every count must be 0 or the staging stays off.
-- =============================================================================
\set ON_ERROR_STOP on
BEGIN;

-- Guard: refuse to run on a database that looks like production.
DO $$
BEGIN
  IF current_database() !~ '(staging|stg|test|anon|local)' THEN
    RAISE EXCEPTION 'anonimizuj.sql: database "%" does not look like staging (name must contain staging/stg/test/anon/local)', current_database();
  END IF;
END $$;

-- Helpers (dropped at the end): deterministic numbering + masking of free text.
CREATE TEMP TABLE anon_client_map AS
  SELECT id, row_number() OVER (ORDER BY created_at, id) AS n FROM clients_client;

CREATE OR REPLACE FUNCTION pg_temp.mask_text(t text) RETURNS text
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN t IS NULL OR t = '' THEN t ELSE
    regexp_replace(
      regexp_replace(t, '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', 'ukryty@example.test', 'g'),
      '(\+?48[ -]?)?\d{3}[ -]?\d{3}[ -]?\d{3}', '500 000 000', 'g')
  END
$$;

-- 0. Client names inside free text of their own repairs (must run before step 1,
--    while real names are still known). Names shorter than 3 chars are skipped.
UPDATE repairs_repairrequest r SET
  problem_description = regexp_replace(regexp_replace(r.problem_description, '\m' || c.first_name || '\M', 'Klient', 'gi'), '\m' || c.last_name || '\M', 'Testowy', 'gi'),
  internal_notes      = regexp_replace(regexp_replace(r.internal_notes,      '\m' || c.first_name || '\M', 'Klient', 'gi'), '\m' || c.last_name || '\M', 'Testowy', 'gi'),
  client_notes        = regexp_replace(regexp_replace(r.client_notes,        '\m' || c.first_name || '\M', 'Klient', 'gi'), '\m' || c.last_name || '\M', 'Testowy', 'gi'),
  package_notes       = regexp_replace(regexp_replace(r.package_notes,       '\m' || c.first_name || '\M', 'Klient', 'gi'), '\m' || c.last_name || '\M', 'Testowy', 'gi')
FROM clients_client c
WHERE r.client_id = c.id AND length(c.first_name) >= 3 AND length(c.last_name) >= 3
  AND c.first_name !~ '[\\^$.|?*+()\[\]{}]' AND c.last_name !~ '[\\^$.|?*+()\[\]{}]';

UPDATE repairs_repairnote n SET note = regexp_replace(regexp_replace(n.note, '\m' || c.first_name || '\M', 'Klient', 'gi'), '\m' || c.last_name || '\M', 'Testowy', 'gi')
FROM repairs_repairrequest r JOIN clients_client c ON c.id = r.client_id
WHERE n.repair_id = r.id AND length(c.first_name) >= 3 AND length(c.last_name) >= 3
  AND c.first_name !~ '[\\^$.|?*+()\[\]{}]' AND c.last_name !~ '[\\^$.|?*+()\[\]{}]';

-- 1. Clients ------------------------------------------------------------------
UPDATE clients_client c SET
  first_name      = 'Klient',
  last_name       = 'Testowy ' || m.n,
  email           = 'klient-' || m.n || '@example.test',
  phone           = '500' || lpad((m.n % 1000000)::text, 6, '0'),
  street          = CASE WHEN c.street <> '' THEN 'ul. Testowa ' || m.n ELSE '' END,
  city            = CASE WHEN c.city <> '' THEN 'Rabka-Zdrój' ELSE '' END,
  postal_code     = CASE WHEN c.postal_code <> '' THEN '34-700' ELSE '' END,
  company_name    = CASE WHEN c.company_name <> '' THEN 'Firma Testowa ' || m.n ELSE '' END,
  nip             = '',
  contact_person  = '',
  company_email   = '',
  company_phone   = '',
  internal_notes  = pg_temp.mask_text(c.internal_notes)
FROM anon_client_map m WHERE m.id = c.id;

UPDATE clients_clientaddress a SET
  street = 'ul. Testowa', house_number = '1', city = 'Rabka-Zdrój', postal_code = '34-700',
  phone  = CASE WHEN a.phone <> '' THEN '500000000' ELSE '' END;

UPDATE clients_clientnote SET note = pg_temp.mask_text(note);
UPDATE clients_clientconsent SET ip_address = NULL;

-- 2. User accounts of clients (staff/admin stay untouched) --------------------
UPDATE accounts_user u SET
  first_name = 'Klient',
  last_name  = 'Testowy ' || coalesce(m.n::text, 'u'),
  email      = 'klient-' || coalesce(m.n::text, 'u-' || left(u.id::text, 8)) || '@example.test',
  phone      = CASE WHEN u.phone <> '' THEN '500' || lpad((coalesce(m.n, 0) % 1000000)::text, 6, '0') ELSE '' END,
  password   = '!'                     -- unusable password: client accounts cannot log in
FROM accounts_user u2
LEFT JOIN clients_client c ON c.user_id = u2.id
LEFT JOIN anon_client_map m ON m.id = c.id
WHERE u.id = u2.id AND u.role = 'client';

-- Tokens, codes, IPs and auth logs
DELETE FROM accounts_passwordresettoken;
DELETE FROM accounts_emailverificationcode;
DELETE FROM accounts_emailverificationattempt;
DELETE FROM accounts_loginfailurelog;
UPDATE accounts_loginactivity SET ip_address = NULL;
DELETE FROM repairs_repairclaimsmscode;

-- 3. Repairs and devices ------------------------------------------------------
UPDATE repairs_repairrequest SET
  claim_token = NULL,
  claim_token_expires_at = NULL,
  problem_description = pg_temp.mask_text(problem_description),
  internal_notes      = pg_temp.mask_text(internal_notes),
  client_notes        = pg_temp.mask_text(client_notes),
  package_notes       = pg_temp.mask_text(package_notes),
  visual_condition_description = pg_temp.mask_text(visual_condition_description);

UPDATE devices_device SET password = '', serial_number = CASE WHEN serial_number <> '' THEN 'SN-TEST' ELSE '' END,
  imei = CASE WHEN imei <> '' THEN '000000000000000' ELSE '' END, notes = pg_temp.mask_text(notes);

UPDATE repairs_repairstatushistory SET notes = pg_temp.mask_text(notes);
UPDATE repairs_repairassignment    SET notes = pg_temp.mask_text(notes);
UPDATE repairs_repairnote          SET note  = pg_temp.mask_text(note);
UPDATE repairs_satisfactionsurvey  SET comment = pg_temp.mask_text(comment);
UPDATE repairs_checklistrunitem    SET note  = pg_temp.mask_text(note);
UPDATE repairs_teamthreadmessage   SET body  = pg_temp.mask_text(body);
UPDATE diagnostics_diagnosticreport SET risk_note = pg_temp.mask_text(risk_note);
UPDATE pricing_quote         SET notes   = pg_temp.mask_text(notes);
UPDATE pricing_quotedecision SET comment = pg_temp.mask_text(comment);
UPDATE accessories_repairaccessoryinterest SET note = pg_temp.mask_text(note);
UPDATE compliance_gdprrequest SET reason = pg_temp.mask_text(reason), resolution_note = pg_temp.mask_text(resolution_note);

-- 4. Orders, communication log, audit -----------------------------------------
UPDATE orders_customerorder SET
  contact_phone = CASE WHEN contact_phone <> '' THEN '500000000' ELSE '' END,
  contact_email = CASE WHEN contact_email <> '' THEN 'zamowienie@example.test' ELSE '' END,
  notes = pg_temp.mask_text(notes);

UPDATE communications_communicationlog SET
  recipient = 'ukryty@example.test', body_snapshot = '', error_message = pg_temp.mask_text(error_message),
  subject = pg_temp.mask_text(subject);

UPDATE common_auditlogentry SET change_payload = '{}'::jsonb;
UPDATE accounts_staffnotification SET description = pg_temp.mask_text(description);
UPDATE tasks_task SET description = pg_temp.mask_text(description);
UPDATE tasks_taskcomment SET body = pg_temp.mask_text(body);

-- 5. No scheduled jobs on staging (Celery is off there anyway) ----------------
UPDATE django_celery_beat_periodictask SET enabled = false;

-- Sessions/tokens of real users must not work on staging
DELETE FROM django_session;
DELETE FROM authtoken_token WHERE user_id IN (SELECT id FROM accounts_user WHERE role = 'client');

COMMIT;

-- =============================================================================
-- Control queries — every row must show 0.
-- =============================================================================
SELECT 'clients_client: e-mail spoza example.test' AS kontrola, count(*) AS bledy
  FROM clients_client WHERE email NOT LIKE '%@example.test'
UNION ALL SELECT 'clients_client: telefon nie 500xxxxxx', count(*)
  FROM clients_client WHERE phone <> '' AND phone !~ '^500\d{6}$'
UNION ALL SELECT 'clients_client: NIP / dane firmy', count(*)
  FROM clients_client WHERE nip <> '' OR company_email <> '' OR company_phone <> '' OR contact_person <> ''
UNION ALL SELECT 'accounts_user (klienci): e-mail spoza example.test', count(*)
  FROM accounts_user WHERE role = 'client' AND email NOT LIKE '%@example.test'
UNION ALL SELECT 'repairs: claim_token', count(*)
  FROM repairs_repairrequest WHERE claim_token IS NOT NULL
UNION ALL SELECT 'devices: hasło urządzenia', count(*)
  FROM devices_device WHERE password <> ''
UNION ALL SELECT 'tokeny/kody (reset, weryfikacja, SMS)', (SELECT count(*) FROM accounts_passwordresettoken)
  + (SELECT count(*) FROM accounts_emailverificationcode) + (SELECT count(*) FROM repairs_repairclaimsmscode)
UNION ALL SELECT 'communicationlog: prawdziwy odbiorca', count(*)
  FROM communications_communicationlog WHERE recipient NOT LIKE '%@example.test'
UNION ALL SELECT 'zamówienia: e-mail spoza example.test', count(*)
  FROM orders_customerorder WHERE contact_email <> '' AND contact_email NOT LIKE '%@example.test'
UNION ALL SELECT 'notatki naprawy: wzorzec e-maila', count(*)
  FROM repairs_repairrequest WHERE concat_ws(' ', problem_description, internal_notes, client_notes, package_notes)
    ~ '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}' AND concat_ws(' ', problem_description, internal_notes, client_notes, package_notes) !~ '@example\.test'
UNION ALL SELECT 'celery beat: włączone zadania', count(*)
  FROM django_celery_beat_periodictask WHERE enabled
UNION ALL SELECT 'sesje', count(*) FROM django_session;
