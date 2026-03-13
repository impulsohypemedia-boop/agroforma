"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function RegistroPage() {
  const router = useRouter();
  const [nombre,    setNombre]    = useState("");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [success,   setSuccess]   = useState(false);

  const supabase = createClient();

  async function handleGoogle() {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) { setError(error.message); setLoading(false); }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre_completo: nombre },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message === "User already registered"
        ? "Ya existe una cuenta con ese email. Iniciá sesión."
        : error.message
      );
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    }
  }

  if (success) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#F9F8F4", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: "#EBF3E8", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="#3D7A1C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1A1A1A", marginBottom: 10 }}>¡Cuenta creada!</h2>
          <p style={{ fontSize: 14, color: "#6B6560", lineHeight: 1.6 }}>
            Te enviamos un email de confirmación. Revisá tu bandeja de entrada y hacé click en el link para activar tu cuenta.
          </p>
          <p style={{ fontSize: 12, color: "#9B9488", marginTop: 16 }}>Redirigiendo al login…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F9F8F4", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <h1 style={{ fontFamily: "var(--font-fraunces)", fontSize: 38, fontWeight: 600, color: "#1A3311", letterSpacing: "-0.5px", margin: 0 }}>
            AgroForma<span style={{ color: "#D4AD3C" }}>.</span>
          </h1>
          <p style={{ marginTop: 10, fontSize: 14, color: "#6B6560", lineHeight: 1.5, maxWidth: 320, margin: "10px auto 0" }}>
            La inteligencia artificial de la empresa agropecuaria argentina
          </p>
        </div>

        {/* Card */}
        <div style={{ backgroundColor: "#FFFFFF", borderRadius: 20, border: "1px solid #E8E5DE", padding: "32px 32px 28px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1A1A1A", marginBottom: 24, textAlign: "center" }}>
            Creá tu cuenta
          </h2>

          {/* Error */}
          {error && (
            <div style={{ backgroundColor: "#FEE9E9", border: "1px solid #FBCFCF", borderRadius: 10, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: "#C0392B" }}>
              {error}
            </div>
          )}

          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              padding: "11px 16px", borderRadius: 12, border: "1.5px solid #E8E5DE",
              backgroundColor: "#FFFFFF", cursor: loading ? "not-allowed" : "pointer",
              fontSize: 14, fontWeight: 600, color: "#1A1A1A",
              transition: "background 0.15s", opacity: loading ? 0.7 : 1,
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#F9F8F4")}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
          >
            <GoogleIcon />
            Continuar con Google
          </button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
            <div style={{ flex: 1, height: 1, backgroundColor: "#E8E5DE" }} />
            <span style={{ fontSize: 12, color: "#9B9488", fontWeight: 500 }}>o</span>
            <div style={{ flex: 1, height: 1, backgroundColor: "#E8E5DE" }} />
          </div>

          {/* Form */}
          <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6B6560", marginBottom: 6 }}>
                Nombre completo
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                placeholder="Juan Pérez"
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: 10,
                  border: "1.5px solid #E8E5DE", fontSize: 14, color: "#1A1A1A",
                  backgroundColor: "#FAFAF8", outline: "none", boxSizing: "border-box",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#3D7A1C")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#E8E5DE")}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6B6560", marginBottom: 6 }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="nombre@empresa.com"
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: 10,
                  border: "1.5px solid #E8E5DE", fontSize: 14, color: "#1A1A1A",
                  backgroundColor: "#FAFAF8", outline: "none", boxSizing: "border-box",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#3D7A1C")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#E8E5DE")}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6B6560", marginBottom: 6 }}>
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: 10,
                  border: "1.5px solid #E8E5DE", fontSize: 14, color: "#1A1A1A",
                  backgroundColor: "#FAFAF8", outline: "none", boxSizing: "border-box",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#3D7A1C")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#E8E5DE")}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", padding: "11px 16px", borderRadius: 12, border: "none",
                backgroundColor: loading ? "#6B9F52" : "#3D7A1C", color: "#FFFFFF",
                fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                marginTop: 4, transition: "background 0.15s",
              }}
              onMouseOver={(e) => { if (!loading) e.currentTarget.style.backgroundColor = "#2E5E14"; }}
              onMouseOut={(e) => { if (!loading) e.currentTarget.style.backgroundColor = "#3D7A1C"; }}
            >
              {loading ? "Creando cuenta…" : "Crear cuenta"}
            </button>
          </form>
        </div>

        {/* Login link */}
        <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#6B6560" }}>
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" style={{ color: "#3D7A1C", fontWeight: 600, textDecoration: "none" }}>
            Iniciá sesión
          </Link>
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
