/**
 * GENERATED from lib/tech/daylight.ts → buildDaylightTable(2026, RABKA). Do not edit by hand:
 * daylight.test.ts fails and prints the new array when the function changes.
 * [sunrise, sunset] in minutes after 00:00 UTC on the 15th of each month, January first.
 *
 * TODO(krystian): podmienić na plik z prokom-web (src/lib/shared/daylight.generated.ts) po scaleniu
 * WSP-M — jedna tablica dla wszystkich linii. Uwaga: tu są minuty UTC, nie czasu warszawskiego
 * (kontrakt §2.2 mówi o czasie warszawskim) — przy czasie lokalnym interpolacja między 15.03 a 15.04
 * i 15.10 a 15.11 myli się do ~30 min wokół zmiany czasu. Ustalić z prokom-web jeden format.
 */
export const DAYLIGHT_TABLE: readonly number[] = [391, 908, 350, 959, 293, 1005, 228, 1053, 175, 1098, 152, 1129, 170, 1123, 211, 1078, 257, 1014, 302, 950, 352, 898, 390, 880];
