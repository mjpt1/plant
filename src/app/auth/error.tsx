"use client";

function isFa(): boolean {
  if (typeof document === "undefined") return true;
  const match = document.cookie.match(/(?:^|;\s*)plantcare-locale=([^;]+)/);
  if (match?.[1] === "en") return false;
  return !document.documentElement.lang?.startsWith("en");
}

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const fa = isFa();

  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        textAlign: "center",
      }}
      dir={fa ? "rtl" : "ltr"}
    >
      <p style={{ color: "#6b7280", marginBottom: "1rem" }}>
        {fa ? "خطا در ورود. دوباره تلاش کنید." : error.message}
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
    </div>
  );
}
