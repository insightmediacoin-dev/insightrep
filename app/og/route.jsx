import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: "#0f1729",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Arial, sans-serif",
          padding: "60px",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
          <div style={{
            width: "64px", height: "64px", background: "#E5322D",
            borderRadius: "16px", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: "24px", fontWeight: "900", color: "#fff",
          }}>
            IR
          </div>
          <span style={{ fontSize: "32px", fontWeight: "700", color: "#fff" }}>InsightRep</span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: "56px", fontWeight: "900", color: "#fff",
          textAlign: "center", margin: "0 0 16px", lineHeight: 1.1,
        }}>
          Turn great visits into{" "}
          <span style={{ color: "#E5322D" }}>Google reviews</span>
        </h1>

        {/* Subtext */}
        <p style={{ fontSize: "24px", color: "#8892a4", textAlign: "center", margin: "0 0 40px" }}>
          AI-powered QR review system for restaurants, cafes and hotels in India
        </p>

        {/* Stats */}
        <div style={{ display: "flex", gap: "32px" }}>
          {[
            { v: "60s", l: "Time to review" },
            { v: "3x", l: "More reviews" },
            { v: "Rs.49/day", l: "Cost per day" },
          ].map((s) => (
            <div key={s.l} style={{
              background: "#1a2540", borderRadius: "16px", padding: "20px 32px",
              display: "flex", flexDirection: "column", alignItems: "center",
            }}>
              <span style={{ fontSize: "32px", fontWeight: "900", color: "#E5322D" }}>{s.v}</span>
              <span style={{ fontSize: "14px", color: "#8892a4", marginTop: "4px" }}>{s.l}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p style={{ position: "absolute", bottom: "32px", fontSize: "16px", color: "#555" }}>
          qr.insightmedia.co.in · By Insight Media, Chh. Sambhajinagar
        </p>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}