import { Suspense } from "react";
import { ProductsClient } from "./ProductsClient";

export const metadata = {
  title: "Products | Vitolux",
  description: "Vitolux product catalog: generators, welding, heat pumps, stabilizers, compressors. UAH & EUR.",
};

function ProductsFallback() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
      <div className="flex gap-8">
        <div className="w-64 h-96 bg-gray-100 rounded animate-pulse" />
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsFallback />}>
      <ProductsClient />
    </Suspense>
  );
}
