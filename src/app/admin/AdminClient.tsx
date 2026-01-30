"use client";

import { useState, useMemo } from "react";
import type { Product, Category } from "@/data/types";

type Props = {
  initialProducts: Product[];
  categories: Category[];
};

export function AdminClient({ initialProducts, categories }: Props) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Partial<Product>>({});

  const filtered = useMemo(() => {
    let list = products;
    if (categoryFilter) list = list.filter((p) => p.categoryId === categoryFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name_uk.toLowerCase().includes(q) ||
          p.name_en.toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, categoryFilter, search]);

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setCreating(false);
    setForm({
      id: p.id,
      slug: p.slug,
      categoryId: p.categoryId,
      name_uk: p.name_uk,
      name_en: p.name_en,
      description_uk: p.description_uk,
      description_en: p.description_en,
      priceUAH: p.priceUAH,
      priceEUR: p.priceEUR,
      article: p.article,
      isPromo: p.isPromo,
    });
  };

  const startCreate = () => {
    setCreating(true);
    setEditingId(null);
    setForm({
      slug: "",
      categoryId: categories[0]?.id ?? "",
      name_uk: "",
      name_en: "",
      description_uk: "",
      description_en: "",
      priceUAH: 0,
      priceEUR: 0,
      article: "",
      isPromo: false,
    });
  };

  const cancelForm = () => {
    setEditingId(null);
    setCreating(false);
    setForm({});
  };

  const saveProduct = () => {
    if (
      !form.name_uk?.trim() ||
      !form.name_en?.trim() ||
      !form.categoryId ||
      form.priceUAH == null ||
      form.priceEUR == null
    ) {
      return;
    }
    const slug =
      form.slug?.trim() ||
      form.name_en?.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") ||
      "product";
    if (editingId) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingId
            ? {
                ...p,
                ...form,
                slug,
                priceUAH: Number(form.priceUAH),
                priceEUR: Number(form.priceEUR),
              }
            : p
        )
      );
      setEditingId(null);
    } else if (creating) {
      const newId = String(Math.max(0, ...products.map((p) => Number(p.id) || 0)) + 1);
      setProducts((prev) => [
        ...prev,
        {
          id: newId,
          slug: slug + "-" + newId,
          categoryId: form.categoryId!,
          name_uk: form.name_uk!,
          name_en: form.name_en!,
          description_uk: form.description_uk ?? "",
          description_en: form.description_en ?? "",
          priceUAH: Number(form.priceUAH),
          priceEUR: Number(form.priceEUR),
          article: form.article,
          isPromo: form.isPromo ?? false,
        },
      ]);
      setCreating(false);
    }
    setForm({});
  };

  const deleteProduct = (id: string) => {
    if (confirm("Delete this product?")) setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const showForm = editingId !== null || creating;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-primary-dark mb-6">Admin panel</h1>
      <p className="text-gray-600 mb-6">Manage products. Changes are kept in memory (no backend).</p>

      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="search"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg max-w-xs"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name_en}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={startCreate}
          className="px-4 py-2 bg-accent text-white font-semibold rounded-lg hover:bg-accent-hover transition"
        >
          Create
        </button>
      </div>

      {showForm && (
        <div className="mb-8 p-6 border border-gray-200 rounded-lg bg-gray-50">
          <h2 className="text-xl font-semibold text-primary-dark mb-4">
            {editingId ? "Edit product" : "Create product"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name (UK)</label>
              <input
                value={form.name_uk ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, name_uk: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name (EN)</label>
              <input
                value={form.name_en ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, name_en: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (UK)</label>
              <textarea
                value={form.description_uk ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, description_uk: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (EN)</label>
              <textarea
                value={form.description_en ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, description_en: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={form.categoryId ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name_en}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Article</label>
              <input
                value={form.article ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, article: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price UAH</label>
              <input
                type="number"
                min={0}
                value={form.priceUAH ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, priceUAH: Number(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price EUR</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.priceEUR ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, priceEUR: Number(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPromo"
                checked={form.isPromo ?? false}
                onChange={(e) => setForm((f) => ({ ...f, isPromo: e.target.checked }))}
                className="rounded border-gray-300 text-accent"
              />
              <label htmlFor="isPromo" className="text-sm font-medium text-gray-700">
                Promo
              </label>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={saveProduct}
              className="px-4 py-2 bg-accent text-white font-semibold rounded-lg hover:bg-accent-hover transition"
            >
              Save
            </button>
            <button
              type="button"
              onClick={cancelForm}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-primary-dark text-white">
            <tr>
              <th className="text-left p-3">Name (EN)</th>
              <th className="text-left p-3">Category</th>
              <th className="text-right p-3">UAH</th>
              <th className="text-right p-3">EUR</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const cat = categories.find((c) => c.id === p.categoryId);
              return (
                <tr key={p.id} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="p-3">{p.name_en}</td>
                  <td className="p-3 text-gray-600">{cat?.name_en ?? p.categoryId}</td>
                  <td className="p-3 text-right">{p.priceUAH.toLocaleString()}</td>
                  <td className="p-3 text-right">{p.priceEUR.toLocaleString()}</td>
                  <td className="p-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(p)}
                      className="text-accent hover:underline text-sm"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteProduct(p.id)}
                      className="text-red-600 hover:underline text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
