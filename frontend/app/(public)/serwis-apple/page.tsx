import { BrandServicePage, brandMetadata } from "@/components/tech/brand/BrandServicePage";
import { brandPage } from "@/config/serwis-marek";

const page = brandPage("apple");

export const metadata = brandMetadata(page);

export default function Page() {
  return <BrandServicePage page={page} />;
}
