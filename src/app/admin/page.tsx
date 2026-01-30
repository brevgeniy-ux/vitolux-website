import { AdminClient } from "./AdminClient";
import { products } from "@/data/products";
import { categories } from "@/data/categories";

export const metadata = {
  title: "Admin panel | Vitolux",
  description: "Vitolux admin – manage products.",
};

export default function AdminPage() {
  return <AdminClient initialProducts={products} categories={categories} />;
}
