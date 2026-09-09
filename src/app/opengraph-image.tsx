import { ImageResponse } from "next/og";

export const alt = "Pizzastack.gg — Find teammates. Find coaches.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#17121f",
          backgroundImage:
            "radial-gradient(circle at 22% 25%, rgba(236,72,153,0.28), transparent 45%), radial-gradient(circle at 78% 75%, rgba(139,92,246,0.28), transparent 45%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <span
            style={{
              fontSize: 76,
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: -1,
            }}
          >
            PIZZA
          </span>
          <span
            style={{
              fontSize: 76,
              fontWeight: 700,
              color: "#ec4899",
              letterSpacing: -1,
            }}
          >
            STACK
          </span>
          <span
            style={{
              display: "flex",
              fontSize: 28,
              fontWeight: 700,
              color: "#f5f3ff",
              backgroundColor: "#8b5cf6",
              padding: "8px 16px",
              borderRadius: 999,
              marginLeft: 8,
            }}
          >
            .GG
          </span>
        </div>
        <p style={{ fontSize: 32, color: "#c7c2d9", marginTop: 30 }}>
          Find teammates. Find coaches.
        </p>
      </div>
    ),
    { ...size },
  );
}
