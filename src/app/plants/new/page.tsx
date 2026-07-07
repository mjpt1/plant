"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { getPersianName } from "@/data/plantNames";

export default function NewPlantPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();

  const [nameEn, setNameEn] = useState("");
  const [nameFa, setNameFa] = useState("");
  const [scientificName, setScientificName] = useState("");
  const [environment, setEnvironment] = useState("indoor");
  const [healthStatus, setHealthStatus] = useState("healthy");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <Link href="/auth" className="btn-primary">{t.nav.login}</Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/plants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nameEn,
        nameFa,
        scientificName,
        environment,
        healthStatus,
        notes,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      if (data.error === "LOCATION_REQUIRED") {
        setError(t.plants.locationRequired);
      } else {
        setError(data.error || t.common.error);
      }
      return;
    }

    router.push(`/plants/${data.plant.id}`);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <Link
        href="/plants"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {t.common.back}
      </Link>

      <h1 className="text-2xl font-bold mb-6">{t.plants.create}</h1>

      <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
        <input
          value={nameEn}
          onChange={(e) => setNameEn(e.target.value)}
          onBlur={() => {
            if (!nameFa.trim() && nameEn.trim()) {
              setNameFa(getPersianName(nameEn.trim()));
            }
          }}
          placeholder={t.plants.nameEn}
          className="input-field"
          required
        />
        <input
          value={nameFa}
          onChange={(e) => setNameFa(e.target.value)}
          placeholder={t.plants.nameFa}
          className="input-field"
          required
        />
        <input
          value={scientificName}
          onChange={(e) => setScientificName(e.target.value)}
          placeholder={t.plants.scientificName}
          className="input-field"
        />
        <select
          value={environment}
          onChange={(e) => setEnvironment(e.target.value)}
          className="input-field"
        >
          {Object.entries(t.plants.environments).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={healthStatus}
          onChange={(e) => setHealthStatus(e.target.value)}
          className="input-field"
        >
          <option value="healthy">{t.scan.results.healthy}</option>
          <option value="warning">{t.scan.results.warning}</option>
          <option value="critical">{t.scan.results.critical}</option>
        </select>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t.plants.notes}
          className="input-field resize-none"
          rows={3}
        />

        {error && (
          <p className="text-sm text-red-500">
            {error}{" "}
            {error.includes(t.plants.locationRequired.split("،")[0]) && (
              <Link href="/settings" className="text-emerald-600 underline">
                {t.plants.goToProfile}
              </Link>
            )}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t.plants.create}
        </button>
        <Link href="/catalog" className="btn-secondary w-full text-center block">
          {t.catalog.title}
        </Link>
      </form>
    </div>
  );
}
