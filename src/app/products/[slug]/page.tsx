import { notFound } from "next/navigation";
import { getProductBySlug } from "@/data";
import { ProductDetailClient } from "./ProductDetailClient";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return { title: "Product | Vitolux" };
  return {
    title: `${product.name_en} | Vitolux`,
    description: product.description_en,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();
  return <ProductDetailClient product={product} />;
}
