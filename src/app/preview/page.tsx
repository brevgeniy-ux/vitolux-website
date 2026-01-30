import { PreviewClient } from "./PreviewClient";
import { getPromoProducts } from "@/data";
import { products } from "@/data/products";

export const metadata = {
  title: "Preview | Vitolux",
  description: "Preview of Vitolux site blocks.",
};

export default function PreviewPage() {
  const promoProducts = getPromoProducts();
  const sampleProducts = products.slice(0, 6);

  return (
    <PreviewClient
      promoProducts={promoProducts}
      sampleProducts={sampleProducts}
    />
  );
}
