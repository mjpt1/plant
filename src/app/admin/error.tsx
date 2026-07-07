"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      style={{
        maxWidth: "32rem",
        margin: "6rem auto",
        padding: "1rem",
        textAlign: "center",
      }}
    >
      <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>
        Admin panel error
      </h2>
      <p style={{ color: "#6b7280", marginBottom: "1rem" }}>{error.message}</p>
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
        Retry
      </button>
    </div>
  );
}
