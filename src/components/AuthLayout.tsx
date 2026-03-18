"use client";

import { useState, useEffect } from "react";

const IMAGES = [
  "https://images.pexels.com/photos/10826782/pexels-photo-10826782.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750",
  "https://images.pexels.com/photos/34182370/pexels-photo-34182370.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750",
  "https://images.pexels.com/photos/735968/pexels-photo-735968.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750",
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const [currentImg, setCurrentImg] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImg((prev) => (prev + 1) % IMAGES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "flex" }}>
      {/* Left half — slideshow (hidden on mobile) */}
      <div
        className="hidden lg:block"
        style={{ width: "50%", position: "relative", overflow: "hidden" }}
      >
        {IMAGES.map((src, i) => (
          <div
            key={src}
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url(${src})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: i === currentImg ? 1 : 0,
              transition: "opacity 1.5s ease-in-out",
            }}
          />
        ))}
        {/* Dark overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to bottom, rgba(26,51,17,0.55) 0%, rgba(26,51,17,0.75) 100%)",
          }}
        />
        {/* Text over image */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: "64px 48px",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-fraunces)",
              fontSize: 36,
              fontWeight: 600,
              color: "#FFFFFF",
              lineHeight: 1.25,
              maxWidth: 440,
              letterSpacing: "-0.5px",
            }}
          >
            La inteligencia artificial de la empresa agropecuaria argentina
          </h2>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", marginTop: 16, maxWidth: 380 }}>
            Subí tu documentación y AgroForma la analiza, estructura y te genera reportes automáticamente.
          </p>
          {/* Dot indicators */}
          <div style={{ display: "flex", gap: 8, marginTop: 32 }}>
            {IMAGES.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === currentImg ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: i === currentImg ? "#D4AD3C" : "rgba(255,255,255,0.4)",
                  transition: "all 0.4s ease",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right half — form */}
      <div
        className="w-full lg:w-1/2"
        style={{ position: "relative", minHeight: "100vh" }}
      >
        {/* Mobile background image */}
        <div
          className="lg:hidden"
          style={{ position: "fixed", inset: 0, zIndex: 0 }}
        >
          {IMAGES.map((src, i) => (
            <div
              key={src}
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `url(${src})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                opacity: i === currentImg ? 1 : 0,
                transition: "opacity 1.5s ease-in-out",
              }}
            />
          ))}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to bottom, rgba(26,51,17,0.6) 0%, rgba(26,51,17,0.8) 100%)",
            }}
          />
        </div>

        {/* Form content */}
        <div
          className="relative lg:bg-[#F9F8F4]"
          style={{
            zIndex: 1,
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <div style={{ width: "100%", maxWidth: 420 }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
