"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import type { TemplateData } from "../../../lib/types";

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const uuid = params.uuid as string;

  const [data, setData] = useState<TemplateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [shareLink, setShareLink] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [successAnimation, setSuccessAnimation] = useState(false);
  
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const lastSavedData = useRef<TemplateData | null>(null);

  const getCredentials = useCallback(() => {
    const email = sessionStorage.getItem("owner_email");
    const template_code = sessionStorage.getItem("template_code");
    const storedUuid = sessionStorage.getItem("template_uuid");
    return { email, template_code, storedUuid };
  }, []);

  // Auto-save functionality
  const performAutoSave = useCallback(async () => {
    const { email, template_code } = getCredentials();
    if (!email || !template_code || !data || !hasUnsavedChanges) return;

    setAutoSaving(true);
    try {
      const res = await fetch("/api/template/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uuid, email, template_code, data }),
      });

      if (res.ok) {
        setHasUnsavedChanges(false);
        lastSavedData.current = JSON.parse(JSON.stringify(data));
        setMessage("✓ Auto-saved");
        setTimeout(() => setMessage(""), 2000);
      }
    } catch (error) {
      console.error("Auto-save failed:", error);
    } finally {
      setAutoSaving(false);
    }
  }, [uuid, data, hasUnsavedChanges, getCredentials]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = null;
    }
  }, []);

  // Validation function
  const validateData = useCallback((templateData: TemplateData): {[key: string]: string} => {
    const newErrors: {[key: string]: string} = {};
    
    if (!templateData.herName.trim()) {
      newErrors.herName = "Name is required";
    }
    if (!templateData.heroHeadline.trim()) {
      newErrors.heroHeadline = "Headline is required";
    }
    if (!templateData.heroSubtext.trim()) {
      newErrors.heroSubtext = "Subtitle is required";
    }
    
    templateData.stats.forEach((stat, index) => {
      if (!stat.label.trim()) {
        newErrors[`stat_${index}_label`] = "Label is required";
      }
      if (stat.value <= 0) {
        newErrors[`stat_${index}_value`] = "Value must be greater than 0";
      }
    });

    templateData.superpowers.forEach((power, index) => {
      if (!power.text.trim()) {
        newErrors[`power_${index}_text`] = "Superpower text is required";
      }
    });

    templateData.memories.forEach((memory, index) => {
      if (!memory.text.trim()) {
        newErrors[`memory_${index}_text`] = "Memory text is required";
      }
    });

    return newErrors;
  }, []);

  // Auto-save timer effect
  useEffect(() => {
    if (hasUnsavedChanges && data) {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
      autoSaveTimer.current = setTimeout(() => {
        performAutoSave();
      }, 3000); // Auto-save after 3 seconds of inactivity
    }

    return cleanup;
  }, [hasUnsavedChanges, data, performAutoSave, cleanup]);

  // Cleanup on component unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);



  // Validate data whenever it changes
  useEffect(() => {
    if (data) {
      const newErrors = validateData(data);
      setErrors(newErrors);
    }
  }, [data, validateData]);

  useEffect(() => {
    const { email, template_code, storedUuid } = getCredentials();

    if (!email || !template_code || storedUuid !== uuid) {
      router.push("/login");
      return;
    }

    const fetchTemplate = async () => {
      const abortController = new AbortController();
      
      try {
        const res = await fetch("/api/template/fetch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uuid, email, template_code }),
          signal: abortController.signal,
        });

        const result = await res.json();

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            router.push("/login");
          } else {
            setMessage("⚠️ Failed to load template. Please try again.");
          }
          return;
        }

        // If data is null (new template), initialize with default data
        if (result.data === null) {
          const { siteData } = await import("../../../data/siteData");
          setData({
            herName: siteData.herName,
            heroHeadline: siteData.heroHeadline,
            heroSubtext: siteData.heroSubtext,
            heroLoading: siteData.heroLoading,
            heroPhotos: siteData.heroPhotos,
            stats: siteData.stats,
            superpowers: siteData.superpowers,
            memories: siteData.memories.slice(0, 3), // Limit to 3 memories
            appreciationResult: siteData.appreciationResult,
            finalMessage: siteData.finalMessage,
            personalNote: siteData.personalNote,
          });
          lastSavedData.current = {
            herName: siteData.herName,
            heroHeadline: siteData.heroHeadline,
            heroSubtext: siteData.heroSubtext,
            heroLoading: siteData.heroLoading,
            heroPhotos: siteData.heroPhotos,
            stats: siteData.stats,
            superpowers: siteData.superpowers,
            memories: siteData.memories.slice(0, 3),
            appreciationResult: siteData.appreciationResult,
            finalMessage: siteData.finalMessage,
            personalNote: siteData.personalNote,
          };
        } else {
          const templateData = result.data as TemplateData;
          // Ensure existing templates also have max 3 memories
          templateData.memories = templateData.memories.slice(0, 3);
          // Clean up any stale local photo paths (e.g., "/memories/memory-1.jpg")
          // Only keep URLs that start with "http" (Supabase public URLs)
          templateData.memories = templateData.memories.map(m => ({
            ...m,
            photo: m.photo && m.photo.startsWith("http") ? m.photo : "",
          }));
          setData(templateData);
          lastSavedData.current = JSON.parse(JSON.stringify(templateData));
        }
        if (result.is_published) {
          setShareLink(`${window.location.origin}/w/${uuid}`);
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error("Failed to fetch template:", error);
          setMessage("⚠️ Network error. Please check your connection and try again.");
        }
      } finally {
        setLoading(false);
      }
      
      return () => abortController.abort();
    };

    fetchTemplate();
  }, [uuid, router, getCredentials]);

  const handleSave = async () => {
    const { email, template_code } = getCredentials();
    if (!email || !template_code || !data) return;

    // Check for validation errors
    const validationErrors = validateData(data);
    if (Object.keys(validationErrors).length > 0) {
      setMessage("Please fix the errors before saving.");
      return;
    }

    setSaving(true);
    setMessage("");

    // Log what we're saving so we can verify image URLs are included
    console.log("[save] Saving template data. Memories:", data.memories.map(m => ({
      text: m.text.substring(0, 30),
      photo: m.photo || "(none)",
    })));

    try {
      const res = await fetch("/api/template/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uuid, email, template_code, data }),
      });

      const result = await res.json();
      console.log("[save] Response:", res.status, result);
      
      if (res.ok) {
        setHasUnsavedChanges(false);
        lastSavedData.current = JSON.parse(JSON.stringify(data));
        setSuccessAnimation(true);
        setMessage("✅ Saved successfully!");
        setTimeout(() => {
          setSuccessAnimation(false);
          setMessage("");
        }, 3000);
      } else {
        setMessage(result.error);
      }
    } catch (err) {
      console.error("[save] Exception:", err);
      setMessage("Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    const { email, template_code } = getCredentials();
    if (!email || !template_code) return;

    setPublishing(true);
    setMessage("");

    try {
      const res = await fetch("/api/template/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uuid, email, template_code }),
      });

      const result = await res.json();
      if (res.ok) {
        setShareLink(`${window.location.origin}${result.shareLink}`);
        setMessage("Published! Share link generated.");
      } else {
        setMessage(result.error);
      }
    } catch {
      setMessage("Failed to publish.");
    } finally {
      setPublishing(false);
    }
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    memoryIndex: number
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log("[upload] File selected:", file.name, file.type, file.size);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage("⚠️ Please select a valid image file.");
      return;
    }

    // Validate file size (1MB limit)
    if (file.size > 1 * 1024 * 1024) {
      setMessage("⚠️ Image must be under 1MB. Please compress or choose a smaller image.");
      return;
    }

    const { email, template_code } = getCredentials();
    if (!email || !template_code || !data) return;

    setUploading(true);
    setMessage("");

    try {
      const currentImageCount = data.memories.filter(m => m.photo).length;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("uuid", uuid);
      formData.append("email", email);
      formData.append("template_code", template_code);
      formData.append("image_count", String(currentImageCount));

      console.log("[upload] Sending to /api/upload-image...");
      const res = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();
      console.log("[upload] Response:", res.status, result);

      if (res.ok && result.url) {
        const updated = { ...data };
        updated.memories = [...updated.memories];
        updated.memories[memoryIndex] = {
          ...updated.memories[memoryIndex],
          photo: result.url,
        };
        setData(updated);
        setHasUnsavedChanges(true);
        setMessage("✅ Image uploaded successfully!");
        console.log("[upload] Image URL stored in memory:", result.url);
      } else {
        const errorMsg = result.error || "Upload failed. Please try again.";
        setMessage(`⚠️ ${errorMsg}`);
        console.error("[upload] Error:", result.error);
      }
    } catch (err: any) {
      console.error("[upload] Exception:", err);
      const errorMessage = err.name === 'AbortError' 
        ? "Upload was cancelled." 
        : "Network error during upload. Please check your connection and try again.";
      setMessage(`⚠️ ${errorMessage}`);
    } finally {
      setUploading(false);
      // Clear the file input
      e.target.value = '';
    }
  };

  // Update helpers
  const updateField = (field: keyof TemplateData, value: string) => {
    if (!data) return;
    const newData = { ...data, [field]: value };
    setData(newData);
    setHasUnsavedChanges(true);
  };

  const updateStat = (
    index: number,
    field: string,
    value: string | number
  ) => {
    if (!data) return;
    const stats = [...data.stats];
    stats[index] = { ...stats[index], [field]: value };
    const newData = { ...data, stats };
    setData(newData);
    setHasUnsavedChanges(true);
  };

  const updateSuperpower = (index: number, field: 'text' | 'icon', value: string) => {
    if (!data) return;
    const superpowers = [...data.superpowers];
    superpowers[index] = { ...superpowers[index], [field]: value };
    const newData = { ...data, superpowers };
    setData(newData);
    setHasUnsavedChanges(true);
  };

  const updateMemoryText = (index: number, value: string) => {
    if (!data) return;
    const memories = [...data.memories];
    memories[index] = { ...memories[index], text: value };
    const newData = { ...data, memories };
    setData(newData);
    setHasUnsavedChanges(true);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+S or Ctrl+S to save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (!saving && Object.keys(errors).length === 0) {
          handleSave();
        }
      }
      
      // Cmd+Enter or Ctrl+Enter to publish
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!publishing && !hasUnsavedChanges && Object.keys(errors).length === 0) {
          handlePublish();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saving, publishing, hasUnsavedChanges, errors]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-pink-50 via-white to-purple-50">
        <div className="text-center" role="status" aria-live="polite">
          <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-600 text-lg">Loading editor...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-pink-50 via-white to-purple-50">
        <div className="text-center" role="alert">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-red-600 text-lg font-medium">Template not found.</p>
          <button 
            onClick={() => router.push('/login')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-pink-50 via-white to-purple-50 py-4 sm:py-8 px-2 sm:px-4">
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 font-serif">
                ✏️ Template Editor
              </h1>
              <div className="flex items-center gap-2 text-sm">
                {hasUnsavedChanges && (
                  <span className="flex items-center gap-1 text-amber-600">
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                    Unsaved changes
                  </span>
                )}
                {autoSaving && (
                  <span className="flex items-center gap-1 text-blue-600">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    Auto-saving...
                  </span>
                )}
                {!hasUnsavedChanges && !autoSaving && lastSavedData.current && (
                  <span className="flex items-center gap-1 text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    All changes saved
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full lg:w-auto">
              <button
                onClick={handleSave}
                disabled={saving || Object.keys(errors).length > 0}
                className={`px-4 sm:px-6 py-2.5 rounded-xl font-medium text-sm sm:text-base transition-all duration-200 ${
                  successAnimation 
                    ? 'bg-green-500 text-white animate-bounce-in' 
                    : 'bg-linear-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600 hover:shadow-lg hover:-translate-y-0.5'
                } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </span>
                ) : (
                  "💾 Save"
                )}
              </button>
              <button
                onClick={handlePublish}
                disabled={publishing || hasUnsavedChanges || Object.keys(errors).length > 0}
                className="px-4 sm:px-6 py-2.5 bg-linear-to-r from-emerald-500 to-green-500 text-white rounded-xl hover:from-emerald-600 hover:to-green-600 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-medium text-sm sm:text-base"
              >
                {publishing ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Publishing...
                  </span>
                ) : (
                  "🚀 Publish"
                )}
              </button>
            </div>
          </div>
          
          {/* Validation Errors Summary */}
          {Object.keys(errors).length > 0 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 text-red-500 shrink-0 mt-0.5">⚠️</div>
                <div>
                  <h3 className="text-sm font-medium text-red-800 mb-1">Please fix the following errors:</h3>
                  <ul className="text-sm text-red-700 space-y-1">
                    {Object.entries(errors).slice(0, 3).map(([key, error]) => (
                      <li key={key}>• {error}</li>
                    ))}
                    {Object.keys(errors).length > 3 && (
                      <li className="text-red-600">• And {Object.keys(errors).length - 3} more...</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Keyboard Shortcuts Hint */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <span>💡</span>
              <span>
                <strong>Pro tips:</strong> Press <kbd className="px-2 py-1 bg-white rounded border text-xs">Cmd+S</kbd> to save • 
                <kbd className="px-2 py-1 bg-white rounded border text-xs ml-1">Cmd+Enter</kbd> to publish • Changes auto-save after 3 seconds
              </span>
            </div>
          </div>
        </div>

        {/* Status message */}
        {message && (
          <div 
            className={`rounded-xl p-4 text-sm mx-2 sm:mx-0 transition-all duration-300 ${
              message.includes('✅') || message.includes('✓') 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : message.includes('⚠️') || message.toLowerCase().includes('error')
                  ? 'bg-red-50 border border-red-200 text-red-800'
                  : 'bg-blue-50 border border-blue-200 text-blue-800'
            }`}
            role="alert"
            aria-live="polite"
          >
            <div className="flex items-center gap-2">
              <div className="shrink-0">
                {message.includes('✅') || message.includes('✓') ? '✅' : 
                 message.includes('⚠️') || message.toLowerCase().includes('error') ? '⚠️' : 'ℹ️'}
              </div>
              <span>{message}</span>
            </div>
          </div>
        )}

        {/* Share link */}
        {shareLink && (
          <div className="bg-linear-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5 mx-2 sm:mx-0 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🎉</span>
              <h3 className="text-lg font-semibold text-green-800">Template Published!</h3>
            </div>
            <p className="text-sm text-green-700 mb-3">
              Your beautiful template is now live! Share this link with others to spread the love.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                readOnly
                value={shareLink}
                className="flex-1 px-4 py-3 bg-white rounded-lg border border-green-300 text-sm text-gray-700 font-mono select-all focus:outline-none focus:ring-2 focus:ring-green-400"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(shareLink);
                    setMessage("✅ Link copied to clipboard!");
                    setTimeout(() => setMessage(""), 2000);
                  } catch (err) {
                    setMessage("⚠️ Failed to copy link");
                  }
                }}
                className="px-4 py-3 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors font-medium flex items-center justify-center gap-2"
              >
                📋 Copy Link
              </button>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <Section title="✨ Hero Section" subtitle="The first impression that captures hearts">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Field label="Her Name" required error={errors.herName}>
              <input
                type="text"
                value={data.herName}
                onChange={(e) => updateField("herName", e.target.value)}
                className="editor-input"
                placeholder="Enter her beautiful name..."
              />
            </Field>
            <Field label="Headline" required error={errors.heroHeadline}>
              <input
                type="text"
                value={data.heroHeadline}
                onChange={(e) => updateField("heroHeadline", e.target.value)}
                className="editor-input"
                placeholder="A powerful headline that celebrates her..."
              />
            </Field>
          </div>
          <Field label="Subtitle" required error={errors.heroSubtext}>
            <input
              type="text"
              value={data.heroSubtext}
              onChange={(e) => updateField("heroSubtext", e.target.value)}
              className="editor-input"
              placeholder="A heartfelt subtitle that sets the tone..."
            />
          </Field>
          <Field label="Loading Text">
            <input
              type="text"
              value={data.heroLoading}
              onChange={(e) => updateField("heroLoading", e.target.value)}
              className="editor-input"
              placeholder="Text shown while the magic loads..."
            />
          </Field>
        </Section>

        {/* Impact Stats */}
        <Section title="📊 Impact Stats" subtitle="Powerful numbers that showcase her incredible achievements">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {data.stats.map((stat, i) => (
              <div
                key={i}
                className="bg-linear-to-br from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Stat {i + 1}</h3>
                  <div className="text-2xl">{stat.emoji}</div>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Label" required error={errors[`stat_${i}_label`]}>
                      <input
                        type="text"
                        value={stat.label}
                        onChange={(e) => updateStat(i, "label", e.target.value)}
                        className="editor-input"
                        placeholder="e.g., Lives Impacted"
                      />
                    </Field>
                    <Field label="Value" required error={errors[`stat_${i}_value`]}>
                      <input
                        type="number"
                        value={stat.value}
                        onChange={(e) =>
                          updateStat(i, "value", parseInt(e.target.value) || 0)
                        }
                        className="editor-input"
                        placeholder="1000"
                        min="1"
                      />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Prefix">
                      <input
                        type="text"
                        value={stat.prefix}
                        onChange={(e) => updateStat(i, "prefix", e.target.value)}
                        className="editor-input"
                        placeholder="e.g., Over"
                      />
                    </Field>
                    <Field label="Suffix">
                      <input
                        type="text"
                        value={stat.suffix}
                        onChange={(e) => updateStat(i, "suffix", e.target.value)}
                        className="editor-input"
                        placeholder="e.g., people"
                      />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Emoji">
                      <input
                        type="text"
                        value={stat.emoji}
                        onChange={(e) => updateStat(i, "emoji", e.target.value)}
                        className="editor-input text-center text-xl"
                        maxLength={2}
                        placeholder="💪"
                      />
                    </Field>
                    <Field label="Display Text (optional)">
                      <input
                        type="text"
                        value={stat.displayText || ""}
                        onChange={(e) =>
                          updateStat(i, "displayText", e.target.value)
                        }
                        className="editor-input"
                        placeholder="Custom display text"
                      />
                    </Field>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Superpowers */}
        <Section title="⭐ Superpowers" subtitle="Her unique strengths and amazing abilities that make her shine">
          <div className="space-y-4">
            {data.superpowers.map((power, i) => (
              <div key={i} className="bg-linear-to-r from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-100 hover:shadow-md transition-all duration-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex flex-col items-center gap-2">
                    <label className="text-sm font-medium text-gray-600">Icon:</label>
                    <input
                      type="text"
                      value={power.icon}
                      onChange={(e) => updateSuperpower(i, 'icon', e.target.value)}
                      className="w-16 h-16 text-center text-2xl border-2 border-purple-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400"
                      maxLength={2}
                      placeholder="💪"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Field label={`Superpower ${i + 1}`} required error={errors[`power_${i}_text`]}>
                      <textarea
                        value={power.text}
                        onChange={(e) => updateSuperpower(i, 'text', e.target.value)}
                        className="editor-input min-h-20 resize-y"
                        placeholder="Describe her amazing superpower..."
                        rows={2}
                      />
                    </Field>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Memories */}
        <Section title="💝 Memories" subtitle="Beautiful moments and photos that tell her story (Maximum 3)">
          <div className="space-y-6">
            {data.memories.slice(0, 3).map((memory, i) => (
              <div
                key={i}
                className="bg-linear-to-br from-pink-50 to-purple-50 rounded-2xl p-6 border border-pink-100 hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-linear-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {i + 1}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Memory {i + 1}</h3>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <Field label="Memory Description" required error={errors[`memory_${i}_text`]}>
                      <textarea
                        value={memory.text}
                        onChange={(e) => updateMemoryText(i, e.target.value)}
                        className="editor-input min-h-24 resize-y"
                        rows={3}
                        placeholder="Share a beautiful memory or moment that captures her essence..."
                      />
                    </Field>
                  </div>
                  
                  <div>
                    <Field label="Memory Photo">
                      <div className="space-y-4">
                        {memory.photo ? (
                          <div className="relative group">
                            <img
                              src={memory.photo}
                              alt={`Memory ${i + 1}`}
                              className="w-full h-48 rounded-xl object-cover border-2 border-gray-200 shadow-sm"
                              onError={(e) => {
                                console.error('Image load error:', memory.photo);
                                e.currentTarget.style.display = 'none';
                                const errorDiv = e.currentTarget.nextElementSibling as HTMLElement;
                                if (errorDiv) {
                                  errorDiv.style.display = 'flex';
                                }
                              }}
                              onLoad={(e) => {
                                e.currentTarget.style.display = 'block';
                                const errorDiv = e.currentTarget.nextElementSibling as HTMLElement;
                                if (errorDiv) {
                                  errorDiv.style.display = 'none';
                                }
                              }}
                            />
                            <div 
                              className="w-full h-48 rounded-xl bg-gray-200 flex items-center justify-center text-gray-500 text-sm"
                              style={{ display: 'none' }}
                            >
                              <div className="text-center">
                                <div className="text-2xl mb-2">📷</div>
                                Image failed to load
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                const updated = { ...data };
                                updated.memories = [...updated.memories];
                                updated.memories[i] = { ...updated.memories[i], photo: '' };
                                setData(updated);
                                setHasUnsavedChanges(true);
                              }}
                              className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 text-white rounded-full text-sm flex items-center justify-center hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                              type="button"
                              title="Remove image"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div className="w-full h-48 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center">
                            <div className="text-center text-gray-500">
                              <div className="text-4xl mb-2">📷</div>
                              <p className="text-sm">No image uploaded</p>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex flex-col gap-3">
                          <div className="relative">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const currentImages = data.memories.filter(m => m.photo).length;
                                if (currentImages >= 3 && !memory.photo) {
                                  setMessage("⚠️ Maximum 3 images allowed total.");
                                  setTimeout(() => setMessage(""), 3000);
                                  return;
                                }
                                handleImageUpload(e, i);
                              }}
                              disabled={uploading}
                              className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 file:cursor-pointer cursor-pointer"
                            />
                          </div>
                          {uploading && (
                            <div className="flex items-center gap-2 text-sm text-purple-600">
                              <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                              Uploading image...
                            </div>
                          )}
                          <p className="text-xs text-gray-500">
                            💡 Tip: Upload images under 1MB for best performance
                          </p>
                        </div>
                      </div>
                    </Field>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Final Section */}
        <Section title="🎉 Final Celebration" subtitle="The grand finale that leaves everyone inspired">
          <div className="space-y-6">
            <Field label="Final Message" required>
              <input
                type="text"
                value={data.finalMessage}
                onChange={(e) => updateField("finalMessage", e.target.value)}
                className="editor-input"
                placeholder="A powerful closing message that inspires..."
              />
            </Field>
            <Field label="Personal Note">
              <textarea
                value={data.personalNote}
                onChange={(e) => updateField("personalNote", e.target.value)}
                className="editor-input min-h-24 resize-y"
                rows={3}
                placeholder="Add a heartfelt personal note that shows your appreciation..."
              />
            </Field>
            <Field label="Appreciation Result">
              <input
                type="text"
                value={data.appreciationResult}
                onChange={(e) =>
                  updateField("appreciationResult", e.target.value)
                }
                className="editor-input"
                placeholder="The outcome or feeling this appreciation creates..."
              />
            </Field>
          </div>
        </Section>

        {/* Floating Action Button */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
          {/* Progress Ring */}
          {(saving || autoSaving || publishing) && (
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-purple-500 shadow-lg"></div>
          )}
          
          {/* Quick Save Button */}
          {hasUnsavedChanges && !autoSaving && (
            <button
              onClick={handleSave}
              disabled={saving || Object.keys(errors).length > 0}
              className="w-12 h-12 bg-linear-to-r from-pink-500 to-purple-500 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 flex items-center justify-center text-lg disabled:opacity-50 disabled:scale-100"
              title="Quick Save (Cmd+S)"
            >
              💾
            </button>
          )}
          
          {/* Publish Button */}
          {!hasUnsavedChanges && !publishing && Object.keys(errors).length === 0 && (
            <button
              onClick={handlePublish}
              className="w-12 h-12 bg-linear-to-r from-emerald-500 to-green-500 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 flex items-center justify-center text-lg"
              title="Publish Template (Cmd+Enter)"
            >
              🚀
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-6 hover:shadow-md transition-shadow duration-200">
      <div className="border-b border-gray-100 pb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 font-serif mb-1">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-gray-600">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
  error,
  required = false,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  required?: boolean;
}) {
  const fieldId = `field-${label.toLowerCase().replace(/\s+/g, '-')}`;
  
  return (
    <div>
      <label 
        className={`block text-sm font-medium mb-2 ${
          error ? 'text-red-600' : 'text-gray-700'
        }`}
      >
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
      </label>
      <div className={`${error ? 'ring-2 ring-red-200 rounded-lg' : ''}`}>
        {children}
      </div>
      {error && (
        <p 
          className="mt-1 text-sm text-red-600 flex items-center gap-1" 
          role="alert"
          aria-live="polite"
        >
          <span className="text-red-500">⚠️</span>
          {error}
        </p>
      )}
    </div>
  );
}
