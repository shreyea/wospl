"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [templateCode, setTemplateCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, template_code: templateCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed.");
        return;
      }

      // Store credentials in sessionStorage for subsequent API calls
      sessionStorage.setItem("template_uuid", data.uuid);
      sessionStorage.setItem("owner_email", email);
      sessionStorage.setItem("template_code", templateCode);

      router.push(`/edit/${data.uuid}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 font-serif">
            💕 Edit Your Template
          </h1>
          <p className="text-gray-500 mt-2 text-sm sm:text-base">
            Enter your email and template code to start editing.
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 space-y-4 sm:space-y-5"
        >
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition text-gray-800"
            />
          </div>

          <div>
            <label
              htmlFor="template_code"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Template Code
            </label>
            <input
              id="template_code"
              type="text"
              required
              value={templateCode}
              onChange={(e) => setTemplateCode(e.target.value)}
              placeholder="Enter your template code"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition text-gray-800"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3 border border-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-lg hover:from-pink-600 hover:to-purple-600 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {loading ? "Verifying..." : "Access Editor"}
          </button>
        </form>
      </div>
    </div>
  );
}
