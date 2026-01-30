import { getPromoProducts } from "@/data";
import { PromosClient } from "./PromosClient";

export const metadata = {
  title: "Promos | Vitolux",
  description: "Vitolux promo products. Special offers in UAH and EUR.",
};

export default function PromosPage() {
  const promoProducts = getPromoProducts();
  return <PromosClient products={promoProducts} />;
}
