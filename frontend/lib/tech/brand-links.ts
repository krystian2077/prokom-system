/**
 * Links to the brand service pages for the client bundle (mega menu "Naprawy" in Capsule).
 * Kept apart from config/serwis-marek.ts so the menu does not pull the page texts into JS;
 * tests/tech/serwis-marek.test.ts checks both lists match.
 */
export const brandLinks: readonly { label: string; href: string }[] = [
  { label: "Apple", href: "/serwis-apple" },
  { label: "Samsung", href: "/serwis-samsung" },
];
