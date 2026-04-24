import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Backport — The Final Layer of Your API Infrastructure";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#080C10",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Header area */}
        <div
          style={{
            display: "flex",
            padding: "60px 80px",
            gap: "60px",
            flex: 1,
          }}
        >
          {/* Left side - Branding */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1 }}>
            {/* Shield */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                marginBottom: "32px",
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 28,
                  border: "2px solid #2CE8C3",
                  color: "#2CE8C3",
                }}
              >
                🛡️
              </div>
              <span
                style={{
                  fontSize: 14,
                  color: "#2CE8C3",
                  fontWeight: 600,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                }}
              >
                Open Source API Gateway
              </span>
            </div>

            {/* Title */}
            <div
              style={{
                fontSize: 72,
                fontWeight: 800,
                color: "#ffffff",
                letterSpacing: "-2px",
                lineHeight: 1,
                marginBottom: "16px",
              }}
            >
              Backport
            </div>

            {/* Subtitle */}
            <div
              style={{
                fontSize: 22,
                color: "#A2BDDB",
                opacity: 0.8,
                marginBottom: "32px",
                lineHeight: 1.4,
              }}
            >
              The Final Layer of Your API Infrastructure
            </div>

            {/* Feature pills */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {["WAF", "Rate Limiting", "Cache", "Transforms", "Mocking"].map((tag) => (
                <div
                  key={tag}
                  style={{
                    padding: "8px 18px",
                    borderRadius: 20,
                    fontSize: 13,
                    fontWeight: 600,
                    border: "1px solid rgba(44,232,195,0.3)",
                    backgroundColor: "rgba(44,232,195,0.08)",
                    color: "#2CE8C3",
                  }}
                >
                  {tag}
                </div>
              ))}
            </div>
          </div>

          {/* Right side - Terminal */}
          <div
            style={{
              width: 480,
              borderRadius: 16,
              backgroundColor: "#0D1117",
              border: "1px solid rgba(255,255,255,0.06)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Terminal bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 16px",
                backgroundColor: "rgba(255,255,255,0.02)",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              <div style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: "#EF4444", opacity: 0.5 }} />
              <div style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: "#FBBF24", opacity: 0.5 }} />
              <div style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: "#2CE8C3", opacity: 0.5 }} />
              <span style={{ fontSize: 11, color: "rgba(162,189,219,0.3)", marginLeft: "auto", fontFamily: "monospace" }}>backport-proxy</span>
            </div>

            {/* Request */}
            <div style={{ padding: "20px 16px", fontFamily: "monospace" }}>
              <div style={{ fontSize: 13, marginBottom: 8 }}>
                <span style={{ color: "#c792ea", fontWeight: "bold" }}>GET</span>
                <span style={{ color: "#2CE8C3", marginLeft: 8 }}>{"/api/users?id=1' OR '1'='1'"}</span>
              </div>
              <div style={{ fontSize: 11, color: "rgba(162,189,219,0.4)", marginBottom: 16 }}>
                X-API-Key: bk_live_••••••••••
              </div>

              {/* Blocked response */}
              <div
                style={{
                  padding: "16px",
                  borderRadius: 10,
                  backgroundColor: "rgba(239,68,68,0.05)",
                  border: "1px solid rgba(239,68,68,0.15)",
                  marginBottom: 20,
                }}
              >
                <div style={{ fontSize: 14, color: "#EF4444", fontWeight: "bold", marginBottom: 6 }}>⚠ 403 Forbidden</div>
                <div style={{ fontSize: 12, color: "rgba(162,189,219,0.5)" }}>Rule: SQL Injection Detected</div>
                <div style={{ fontSize: 11, color: "rgba(162,189,219,0.3)", marginTop: 4 }}>Response time: 3ms</div>
              </div>

              {/* Stats */}
              <div style={{ display: "flex", gap: 12 }}>
                {[
                  { value: "<5ms", label: "OVERHEAD", color: "#2CE8C3" },
                  { value: "MIT", label: "LICENSE", color: "#6BA9FF" },
                  { value: "17+", label: "WAF RULES", color: "#EF4444" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    style={{
                      flex: 1,
                      padding: "12px",
                      borderRadius: 8,
                      backgroundColor: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.04)",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: 20, color: stat.color, fontWeight: "bold", marginBottom: 4 }}>{stat.value}</div>
                    <div style={{ fontSize: 9, color: "rgba(162,189,219,0.4)" }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "0 80px 40px",
            display: "flex",
            alignItems: "center",
            gap: 24,
          }}
        >
          <div style={{ height: 3, width: 120, borderRadius: 2, background: "linear-gradient(90deg, #2CE8C3, #6BA9FF)" }} />
          <span style={{ fontSize: 13, color: "rgba(162,189,219,0.35)" }}>
            Open Source · MIT License · No SDK Required · 30 Second Setup
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
