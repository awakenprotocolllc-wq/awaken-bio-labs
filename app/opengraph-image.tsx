import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import { join } from "path";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Awaken Bio Labs — Research-Grade Peptide Compounds";

export default async function Image() {
  const logoData = await readFile(join(process.cwd(), "public/logo.png"));
  const logoSrc = `data:image/png;base64,${logoData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          background: "#0A0B0D",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "40px",
          padding: "80px",
        }}
      >
        {/* Logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoSrc}
          width={900}
          height={225}
          style={{ objectFit: "contain" }}
          alt="Awaken Bio Labs"
        />

        {/* Divider */}
        <div
          style={{
            width: "120px",
            height: "1px",
            background: "#2A2D33",
          }}
        />

        {/* Tagline */}
        <p
          style={{
            fontFamily: "monospace",
            color: "#57C7D6",
            fontSize: "22px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            textAlign: "center",
            margin: 0,
          }}
        >
          Made in the USA · Third-Party Tested · 99%+ Purity · Research Use Only
        </p>
      </div>
    ),
    { ...size }
  );
}
