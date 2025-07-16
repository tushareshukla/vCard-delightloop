import { Suspense } from "react";
import { GiftTrackerClientComponent } from "@/app/public/gift-tracker/components/gift-tracker-client";
import InfinityLoader from "@/components/common/InfinityLoader"; // Import the loader

// This is a Server Component
export default async function Page({
  params,
}: {
  params: { recipient_id: string };
}) {
  // Await the params to fix the NextJS warning
  const recipient_id = await Promise.resolve(params.recipient_id);
  let recipientData = null;

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/public/track/${recipient_id}`,
      {
        cache: "no-store",
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch: ${res.status}`);
    }

    const json = await res.json();
    console.log("json", json);
    recipientData = json?.data || null;

  } catch (error) {
    console.error("Error fetching recipient data:", error);
    return <div>Error loading gift tracking details. Please try again later.</div>;
  }

  if (!recipientData) {
    return <div>No gift tracking details found.</div>;
  }

  // Pass the data to a client component
  return (
    <Suspense fallback={<InfinityLoader />}>
      <GiftTrackerClientComponent recipientData={recipientData} />
    </Suspense>
  );
}
