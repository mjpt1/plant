"use client";

function isFa(): boolean {
  if (typeof document === "undefined") return true;
  const match = document.cookie.match(/(?:^|;\s*)plantcare-locale=([^;]+)/);
  if (match?.[1] === "en") return false;
  return !document.documentElement.lang?.startsWith("en");
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const fa = isFa();

  return (
    <html lang={fa ? "fa" : "en"} dir={fa ? "rtl" : "ltr"}>
      <body
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🌿</div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          {fa ? "خطای برنامه" : "Application Error"}
        </h1>
        <p style={{ color: "#6b7280", marginBottom: "1.5rem", maxWidth: "28rem" }}>
          {fa
            ? "خطای غیرمنتظره‌ای رخ داد."
            : error.message || "An unexpected error occurred."}
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            padding: "0.5rem 1rem",
            background: "#10b981",
            color: "white",
            border: "none",
            borderRadius: "0.5rem",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          {fa ? "تلاش دوباره" : "Try again"}
        </button>
      </body>
    </html>
  );
}
