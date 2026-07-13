import { Suspense } from "react";
import RecommendClient from "./RecommendClient";

export default function RecommendPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-24 text-sm text-muted-foreground">
          …
        </div>
      }
    >
      <RecommendClient />
    </Suspense>
  );
}
