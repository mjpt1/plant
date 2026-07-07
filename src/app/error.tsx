"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

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
    >
      <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🌿</div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
        Something went wrong
      </h1>
      <p style={{ color: "#6b7280", marginBottom: "1.5rem", maxWidth: "28rem" }}>
        We hit an unexpected error. Please try again.
      </p>
      <div style={{ display: "flex", gap: "0.75rem" }}>
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
          Try again
        </button>
        <button
          type="button"
          onClick={() => {
            window.location.href = "/";
          }}
          style={{
            padding: "0.5rem 1rem",
            background: "transparent",
            color: "#374151",
            border: "1px solid #d1d5db",
            borderRadius: "0.5rem",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Go home
        </button>
      </div>
    </div>
  );
}
