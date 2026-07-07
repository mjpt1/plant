"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Leaf } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { getCategoryFa, getPersianName } from "@/data/plantNames";
import { toast } from "sonner";

const CATEGORIES = [
  "houseplant",
  "succulent",
  "herb",
  "flower",
  "tropical",
  "vegetable",
  "fruit-tree",
  "shrub",
];

export default function CatalogAddPage() {
  const { t, locale } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    nameEn: "",
    nameFa: "",
    scientificName: "",
    category: "houseplant",
    description: "",
    wateringGuide: "",
    lightGuide: "",
    fertilizerGuide: "",
    soilGuide: "",
    toxicity: "",
    difficulty: "moderate",
    isIndoor: true,
    imageUrl: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <Link href="/auth" className="btn-primary">{t.nav.login}</Link>
      </div>
    );
  }

  const update = (key: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || t.common.error);
      return;
    }
    toast.success(t.catalog.submittedPending);
    router.push("/catalog");
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        href="/catalog"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {t.catalog.backToCatalog}
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center">
          <Leaf className="w-6 h-6 text-emerald-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t.catalog.addNewTitle}</h1>
          <p className="text-sm text-gray-500">{t.catalog.addNewSubtitle}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <input
            value={form.nameEn}
            onChange={(e) => update("nameEn", e.target.value)}
            onBlur={() => {
              if (!form.nameFa.trim() && form.nameEn.trim()) {
                update("nameFa", getPersianName(form.nameEn.trim(), form.category));
              }
            }}
            placeholder={t.plants.nameEn}
            className="input-field"
            required
          />
          <input
            value={form.nameFa}
            onChange={(e) => update("nameFa", e.target.value)}
            placeholder={t.plants.nameFa}
            className="input-field"
            required
          />
        </div>
        <input
          value={form.scientificName}
          onChange={(e) => update("scientificName", e.target.value)}
          placeholder={t.plants.scientificName}
          className="input-field"
        />
        <select
          value={form.category}
          onChange={(e) => update("category", e.target.value)}
          className="input-field"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {locale === "fa" ? getCategoryFa(cat) : cat}
            </option>
          ))}
        </select>
        <textarea
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder={t.plants.notes}
          className="input-field min-h-[80px] resize-none"
          rows={3}
        />

        <h3 className="font-medium text-sm text-emerald-600 pt-2">
          {t.catalog.completeProfile}
        </h3>
        <textarea
          value={form.wateringGuide}
          onChange={(e) => update("wateringGuide", e.target.value)}
          placeholder={t.scan.results.watering}
          className="input-field resize-none"
          rows={2}
          required
        />
        <textarea
          value={form.lightGuide}
          onChange={(e) => update("lightGuide", e.target.value)}
          placeholder={t.scan.results.light}
          className="input-field resize-none"
          rows={2}
          required
        />
        <textarea
          value={form.fertilizerGuide}
          onChange={(e) => update("fertilizerGuide", e.target.value)}
          placeholder={t.scan.results.fertilizer}
          className="input-field resize-none"
          rows={2}
        />
        <textarea
          value={form.soilGuide}
          onChange={(e) => update("soilGuide", e.target.value)}
          placeholder={t.scan.results.soilType}
          className="input-field resize-none"
          rows={2}
        />
        <input
          value={form.toxicity}
          onChange={(e) => update("toxicity", e.target.value)}
          placeholder={t.catalog.toxicity}
          className="input-field"
        />
        <select
          value={form.difficulty}
          onChange={(e) => update("difficulty", e.target.value)}
          className="input-field"
        >
          <option value="easy">{t.scan.results.healthy} / Easy</option>
          <option value="moderate">Moderate</option>
          <option value="hard">Hard</option>
        </select>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isIndoor}
            onChange={(e) => update("isIndoor", e.target.checked)}
            className="accent-emerald-500"
          />
          {t.catalog.indoorOnly}
        </label>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            t.catalog.submitPlant
          )}
        </button>
      </form>
    </div>
  );
}
