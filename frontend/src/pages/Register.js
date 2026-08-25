// pages/Register.js
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Register = () => {
  const { register, setError, error } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await register(form.name, form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      setError(
        apiErrors ? apiErrors.map((e) => e.message).join(" · ") : err.response?.data?.message || "Registration failed."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Create account</h1>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit} noValidate>
          <label>Name
            <input type="text" name="name" autoComplete="name"
              value={form.name} onChange={handleChange} required />
          </label>
          <label>Email
            <input type="email" name="email" autoComplete="email"
              value={form.email} onChange={handleChange} required />
          </label>
          <label>Password
            <input type="password" name="password" autoComplete="new-password"
              value={form.password} onChange={handleChange} required />
            <small>Min 8 chars, one uppercase, one number</small>
          </label>
          <button type="submit" disabled={submitting}>
            {submitting ? "Creating…" : "Create account"}
          </button>
        </form>
        <p>Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
};

export default Register;
