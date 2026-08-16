"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { fetchJson } from "@/services/apiClient";
import { clearStoredSession, setStoredSession, type StoredSessionUser } from "@/lib/authSession";
import styles from "./LoginPage.module.css";

function FrogLogo() {
  return (
    <svg className={styles.logoMark} viewBox="0 0 190 118" aria-hidden="true">
      <path d="M48 68c-13 3-22 9-26 20 14 0 27-1 38-5-10 7-24 10-42 10 20 11 53 13 77 4 25 9 57 7 78-4-19 0-33-3-43-10 11 4 24 5 38 5-4-11-13-17-26-20 1-4 2-8 2-12 0-23-22-41-49-41S46 33 46 56c0 4 1 8 2 12Z" />
      <path className={styles.logoStroke} d="M61 59c8-10 20-15 34-15s26 5 34 15M65 76c20 10 40 10 60 0" />
      <circle className={styles.logoEye} cx="61" cy="24" r="17" />
      <circle className={styles.logoEye} cx="129" cy="24" r="17" />
      <circle className={styles.logoPupil} cx="61" cy="24" r="6" />
      <circle className={styles.logoPupil} cx="129" cy="24" r="6" />
      <path className={styles.logoStroke} d="M54 18c5-8 15-8 20 0M122 18c5-8 15-8 20 0" />
      <circle className={styles.logoPupil} cx="83" cy="42" r="3" />
      <circle className={styles.logoPupil} cx="107" cy="42" r="3" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className={styles.lockIcon} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 10V8a5 5 0 0 1 10 0v2" />
      <path d="M6 10h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M5 16a5 5 0 0 1 10 0" />
    </svg>
  );
}

function PasswordIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M6 8V6a4 4 0 0 1 8 0v2" />
      <path d="M5 8h10v8H5z" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M2.5 10s2.7-4.5 7.5-4.5 7.5 4.5 7.5 4.5-2.7 4.5-7.5 4.5S2.5 10 2.5 10Z" />
      <circle cx="10" cy="10" r="2" />
    </svg>
  );
}

export function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await fetchJson<StoredSessionUser>("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      clearStoredSession();
      setStoredSession(user);
      router.push("/dashboard");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Unable to login. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.brandPanel} aria-label="SmartFlood introduction">
        <div className={styles.topOrb} />
        <div className={styles.bottomOrb} />
        <div className={styles.brandContent}>
          <div className={styles.logoBlock}>
            <FrogLogo />
            <strong>smartflood</strong>
          </div>
          <h1>Flood Monitoring &amp; Management System</h1>
          <div className={styles.rule} />
          <p className={styles.quote}>
            When floods rise, SmartFlood stands ready, empowering communities and ensuring no one faces the storm alone.
          </p>
        </div>
        <p className={styles.copyright}>© 2026 Barangay Management System</p>
      </section>

      <section className={styles.formPanel} aria-label="Login">
        <div className={styles.loginCard}>
          <div className={styles.lockBadge}>
            <LockIcon />
          </div>
          <div className={styles.heading}>
            <h2>Welcome Back</h2>
            <p>Enter your credentials to access the system</p>
          </div>

          <form className={styles.loginForm} onSubmit={submitLogin}>
          <div className={styles.formFields}>
            <label className={styles.fieldGroup}>
              <span>Username</span>
              <span className={styles.inputShell}>
                <UserIcon />
                <input
                  aria-label="Email"
                  autoComplete="email"
                  placeholder="Email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </span>
            </label>

            <label className={styles.fieldGroup}>
              <span>Password</span>
              <span className={styles.inputShell}>
                <PasswordIcon />
                <input
                  aria-label="Password"
                  autoComplete="current-password"
                  placeholder="Enter password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  className={styles.iconButton}
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((current) => !current)}
                >
                  <EyeIcon />
                </button>
              </span>
            </label>
          </div>

          {error ? <p className={styles.errorMessage}>{error}</p> : null}

          <button className={styles.forgotLink} type="button">
            Forgot password?
          </button>

          <button className={styles.loginButton} type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
          </form>
        </div>
      </section>
    </main>
  );
}
