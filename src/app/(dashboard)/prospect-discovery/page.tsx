import { ProspectDiscoveryClient } from "@/components/propect-discovery/prospect-discovery-client";
import Loading from "./loading";
import { Suspense } from "react";

export default async function ProspectDiscoveryPage() {
  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
        Prospect Discovery
      </h1>
      <p className="text-lg text-muted-foreground mb-8">
        Find new potential leads by searching the web. Our AI will help
        structure the information.
      </p>
      <Suspense fallback={<Loading />}>
        <ProspectDiscoveryClient />
      </Suspense>
    </div>
  );
}
