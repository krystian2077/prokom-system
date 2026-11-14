import { DevicePage, deviceMetadata } from "@/components/tech/device/DevicePage";
import { devicePageBySlug } from "@/lib/tech/devices";

const page = devicePageBySlug("serwis-drukarek");

export const metadata = deviceMetadata(page);

export default function Page() {
  return <DevicePage page={page} />;
}
