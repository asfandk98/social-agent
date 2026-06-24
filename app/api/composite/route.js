// app/api/composite/route.js
//
// Poster-style ad templates with a "tone" system:
//   tone: "normal" | "urgent" | "flash"
// Each tone swaps the badge copy/color to match the urgency level, like a
// real sale flyer. Runs on Edge runtime (Node runtime's ImageResponse has
// a broken bundled-font path lookup on Windows dev servers).

import { ImageResponse } from "next/og";
import { LOGO_DATA_URI } from "./logo-data";

export const runtime = "edge";

const BRAND = {
  navy: "#0B1A3A",
  navyDeep: "#060F26",
  gold: "#F2B544",
  contactPhone: "+971 52 608 5418",
  website: "www.globalvisaexpert.com",
};

const SERVICE_ITEMS = {
  visa: ["Visa Application", "Travel Insurance", "Air Ticket", "Hotel Booking"],
  tour: ["Flights & Transfers", "Hotel Stay", "Daily Breakfast", "Guided Tours"],
  "tour package": ["Flights & Transfers", "Hotel Stay", "Daily Breakfast", "Guided Tours"],
  flight: ["Flexible Dates", "Checked Baggage", "Seat Selection", "24/7 Support"],
};

// Tone presets: badge text, badge colors, accent override
const TONES = {
  normal: {
    badgeText: "SPECIAL OFFER",
    badgeBg: "#F2B544",
    badgeFg: "#1A1300",
  },
  urgent: {
    badgeText: "HURRY UP - LIMITED SLOTS",
    badgeBg: "#FF5C39",
    badgeFg: "#FFFFFF",
  },
  flash: {
    badgeText: "FLASH SALE - TODAY ONLY",
    badgeBg: "#E0103A",
    badgeFg: "#FFFFFF",
  },
};

// Decorative background: soft color blobs + diagonal accent band,
// so it's not a flat gradient.
function BackgroundDecor({ accent }) {
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex" }}>
      <div style={{
        position: "absolute", top: -120, left: -120, width: 420, height: 420,
        borderRadius: "50%", background: accent, opacity: 0.12, display: "flex",
      }} />
      <div style={{
        position: "absolute", bottom: -160, left: 180, width: 520, height: 520,
        borderRadius: "50%", background: "#3A5BFF", opacity: 0.10, display: "flex",
      }} />
      <div style={{
        position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
        background: "linear-gradient(120deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 35%)",
        display: "flex",
      }} />
    </div>
  );
}

// Corner price-tag badge with a little notch, instead of a plain pill
function TagBadge({ text, bg, fg }) {
  return (
    <div style={{ display: "flex", alignItems: "center", position: "absolute", top: 40, right: 50 }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        background: bg, color: fg, borderRadius: 999,
        padding: "12px 26px", fontSize: 16, fontWeight: 800, letterSpacing: 1,
      }}>
        {text}
      </div>
    </div>
  );
}

function PosterLayout({ data, logoUri, tone }) {
  const key = (data.serviceType || "").toLowerCase();
  const items = SERVICE_ITEMS[key] || SERVICE_ITEMS.visa;
  const t = TONES[tone] || TONES.normal;
  const headlineMain = (data.destination || "TRAVEL").toUpperCase();

  return (
    <div style={{
      display: "flex", width: "1200px", height: "630px", position: "relative",
      background: `linear-gradient(135deg, ${BRAND.navy} 0%, ${BRAND.navyDeep} 100%)`,
    }}>
      <BackgroundDecor accent={t.badgeBg} />

      {/* Circular photo crop, top-right */}
      <div style={{
        position: "absolute", top: 95, right: 60,
        width: 380, height: 380, borderRadius: "50%",
        border: `6px solid ${BRAND.gold}`, overflow: "hidden",
        display: "flex",
      }}>
        <img src={data.imageUrl} width={380} height={380} style={{ objectFit: "cover" }} />
      </div>

      {/* Logo only, no brand text */}
      <div style={{ position: "absolute", top: 40, left: 50, display: "flex" }}>
        <img src={logoUri} width={58} height={58} style={{ borderRadius: 10 }} />
      </div>

      <TagBadge text={t.badgeText} bg={t.badgeBg} fg={t.badgeFg} />

      {/* Headline block */}
      <div style={{ position: "absolute", top: 200, left: 50, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontSize: 26, fontWeight: 700, color: BRAND.gold, letterSpacing: 4 }}>
          LET'S GO
        </div>
        <div style={{ display: "flex", fontSize: 62, fontWeight: 800, color: "#FFFFFF", lineHeight: 1, marginTop: 4 }}>
          {headlineMain}
        </div>
      </div>

      {/* Service checklist */}
      <div style={{ position: "absolute", top: 340, left: 50, display: "flex", flexDirection: "column", maxWidth: 420 }}>
        <div style={{ display: "flex", fontSize: 21, fontWeight: 800, color: "#FFFFFF", marginBottom: 12 }}>
          OUR SERVICE
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {items.map((item) => (
            <div key={item} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", color: BRAND.gold, fontSize: 18, fontWeight: 800 }}>{">"}</div>
              <div style={{ display: "flex", fontSize: 17, color: "#E5E8F2" }}>{item}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Package / price box */}
      <div style={{
        position: "absolute", top: 340, left: 540,
        display: "flex", flexDirection: "column",
        background: "rgba(255,255,255,0.07)", borderRadius: 18,
        border: `1px solid rgba(242,181,68,0.35)`,
        padding: "24px 28px", width: 320,
      }}>
        <div style={{ display: "flex", fontSize: 19, fontWeight: 800, color: BRAND.gold, marginBottom: 8 }}>
          PACKAGE DEAL
        </div>
        <div style={{ display: "flex", fontSize: 15, color: "#C9CDE0", marginBottom: 12, lineHeight: 1.4 }}>
          All-inclusive offer, limited slots available
        </div>
        <div style={{ display: "flex", fontSize: 38, fontWeight: 800, color: "#FFFFFF" }}>
          {data.currency} {data.price}
        </div>
      </div>

      {/* Footer contact bar */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "rgba(0,0,0,0.28)", padding: "18px 50px",
        borderTop: `1px solid rgba(242,181,68,0.3)`,
      }}>
        <div style={{ display: "flex", fontSize: 15, color: "#C9CDE0" }}>{BRAND.website}</div>
        <div style={{ display: "flex", fontSize: 17, fontWeight: 700, color: "#FFFFFF" }}>
          BOOK NOW: {BRAND.contactPhone}
        </div>
      </div>
    </div>
  );
}

export async function POST(req) {
  try {
    const data = await req.json();

    if (!data.imageUrl) {
      return Response.json({ error: "imageUrl is required" }, { status: 400 });
    }

    // tone: "normal" | "urgent" | "flash" — defaults to "normal"
    const tone = TONES[data.tone] ? data.tone : "normal";

    return new ImageResponse(<PosterLayout data={data} logoUri={LOGO_DATA_URI} tone={tone} />, {
      width: 1200,
      height: 630,
    });
  } catch (err) {
    console.error("COMPOSITE IMAGE ERROR", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const data = Object.fromEntries(searchParams.entries());

  if (!data.imageUrl) {
    return Response.json({ error: "imageUrl is required" }, { status: 400 });
  }

  const tone = TONES[data.tone] ? data.tone : "normal";

  return new ImageResponse(<PosterLayout data={data} logoUri={LOGO_DATA_URI} tone={tone} />, {
    width: 1200,
    height: 630,
  });
}