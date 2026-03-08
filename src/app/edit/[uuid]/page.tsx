"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import type { TemplateData } from "@/lib/types";

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
  
  const autoSaveTimer = useRef<NodeJS.Timeout>();
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

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [hasUnsavedChanges, data, performAutoSave]);

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
      try {
        const res = await fetch("/api/template/fetch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uuid, email, template_code }),
        });

        const result = await res.json();

        if (!res.ok) {
          router.push("/login");
          return;
        }

        // If data is null (new template), initialize with default data
        if (result.data === null) {
          const { siteData } = await import("@/data/siteData");
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
        }
        if (result.is_published) {
          setShareLink(`${window.location.origin}/w/${uuid}`);
        }
      } catch {
        setMessage("Failed to load template.");
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [uuid, router, getCredentials]);

  const handleSave = async () => {
    const { email, template_code } = getCredentials();
    if (!email || !template_code || !data) return;

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
      setMessage(res.ok ? "Saved successfully!" : result.error);
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

    if (file.size > 1 * 1024 * 1024) {
      setMessage("Image must be under 1MB.");
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
        setMessage("Image uploaded successfully!");
        console.log("[upload] Image URL stored in memory:", result.url);
      } else {
        setMessage(result.error || "Upload failed.");
        console.error("[upload] Error:", result.error);
      }
    } catch (err) {
      console.error("[upload] Exception:", err);
      setMessage("Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  // Update helpers
  const updateField = (field: keyof TemplateData, value: string) => {
    if (!data) return;
    setData({ ...data, [field]: value });
  };

  const updateStat = (
    index: number,
    field: string,
    value: string | number
  ) => {
    if (!data) return;
    const stats = [...data.stats];
    stats[index] = { ...stats[index], [field]: value };
    setData({ ...data, stats });
  };

  const updateSuperpower = (index: number, field: 'text' | 'icon', value: string) => {
    if (!data) return;
    const superpowers = [...data.superpowers];
    superpowers[index] = { ...superpowers[index], [field]: value };
    setData({ ...data, superpowers });
  };

  const updateMemoryText = (index: number, value: string) => {
    if (!data) return;
    const memories = [...data.memories];
    memories[index] = { ...memories[index], text: value };
    setData({ ...data, memories });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-pink-50 via-white to-purple-50">
        <p className="text-gray-500 text-lg">Loading editor...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-pink-50 via-white to-purple-50">
        <p className="text-red-500 text-lg">Template not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-pink-50 via-white to-purple-50 py-4 sm:py-8 px-2 sm:px-4">
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 font-serif">
            ✏️ Template Editor
          </h1>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 sm:px-5 py-2 bg-linear-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600 transition disabled:opacity-50 font-medium text-sm sm:text-base"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="px-4 sm:px-5 py-2 bg-linear-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition disabled:opacity-50 font-medium text-sm sm:text-base"
            >
              {publishing ? "Publishing..." : "Publish"}
            </button>
          </div>
        </div>

        {/* Status message */}
        {message && (
          <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-700 mx-2 sm:mx-0">
            {message}
          </div>
        )}

        {/* Share link */}
        {shareLink && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mx-2 sm:mx-0">
            <p className="text-sm font-medium text-green-800 mb-1">
              🔗 Share Link:
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                readOnly
                value={shareLink}
                className="flex-1 px-3 py-2 bg-white rounded border border-green-300 text-sm text-gray-700"
              />
              <button
                onClick={() => navigator.clipboard.writeText(shareLink)}
                className="px-3 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition"
              >
                Copy
              </button>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <Section title="Hero Section">
          <Field label="Her Name">
            <input
              type="text"
              value={data.herName}
              onChange={(e) => updateField("herName", e.target.value)}
              className="editor-input"
            />
          </Field>
          <Field label="Headline">
            <input
              type="text"
              value={data.heroHeadline}
              onChange={(e) => updateField("heroHeadline", e.target.value)}
              className="editor-input"
            />
          </Field>
          <Field label="Subtitle">
            <input
              type="text"
              value={data.heroSubtext}
              onChange={(e) => updateField("heroSubtext", e.target.value)}
              className="editor-input"
            />
          </Field>
          <Field label="Loading Text">
            <input
              type="text"
              value={data.heroLoading}
              onChange={(e) => updateField("heroLoading", e.target.value)}
              className="editor-input"
            />
          </Field>
        </Section>

        {/* Impact Stats */}
        <Section title="Impact Stats">
          <div className="space-y-4">
            {data.stats.map((stat, i) => (
              <div
                key={i}
                className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-3 border border-gray-100"
              >
                <p className="text-sm font-medium text-gray-600">
                  Stat {i + 1}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Label">
                    <input
                      type="text"
                      value={stat.label}
                      onChange={(e) => updateStat(i, "label", e.target.value)}
                      className="editor-input"
                    />
                  </Field>
                  <Field label="Value">
                    <input
                      type="number"
                      value={stat.value}
                      onChange={(e) =>
                        updateStat(i, "value", parseInt(e.target.value) || 0)
                      }
                      className="editor-input"
                    />
                  </Field>
                  <Field label="Prefix">
                    <input
                      type="text"
                      value={stat.prefix}
                      onChange={(e) => updateStat(i, "prefix", e.target.value)}
                      className="editor-input"
                    />
                  </Field>
                  <Field label="Suffix">
                    <input
                      type="text"
                      value={stat.suffix}
                      onChange={(e) => updateStat(i, "suffix", e.target.value)}
                      className="editor-input"
                    />
                  </Field>
                  <Field label="Emoji">
                    <input
                      type="text"
                      value={stat.emoji}
                      onChange={(e) => updateStat(i, "emoji", e.target.value)}
                      className="editor-input"
                      maxLength={2}
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
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Superpowers */}
        <Section title="Superpowers">
          {data.superpowers.map((power, i) => (
            <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 min-w-0">
                <label className="text-xs text-gray-500 whitespace-nowrap">Emoji:</label>
                <input
                  type="text"
                  value={power.icon}
                  onChange={(e) => updateSuperpower(i, 'icon', e.target.value)}
                  className="w-12 h-8 text-center text-lg border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-pink-300"
                  maxLength={2}
                />
              </div>
              <div className="flex-1 min-w-0">
                <label className="text-xs text-gray-500 block mb-1">Text:</label>
                <input
                  type="text"
                  value={power.text}
                  onChange={(e) => updateSuperpower(i, 'text', e.target.value)}
                  className="editor-input w-full"
                />
              </div>
            </div>
          ))}
        </Section>

        {/* Memories */}
        <Section title="Memories (Max 3)">
          {data.memories.slice(0, 3).map((memory, i) => (
            <div
              key={i}
              className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-100"
            >
              <p className="text-sm font-medium text-gray-600">
                Memory {i + 1}
              </p>
              <Field label="Text">
                <textarea
                  value={memory.text}
                  onChange={(e) => updateMemoryText(i, e.target.value)}
                  className="editor-input min-h-15 resize-y"
                  rows={2}
                />
              </Field>
              <Field label="Image">
                <div className="flex flex-col gap-3">
                  {memory.photo && (
                    <div className="relative inline-block">
                      <img
                        src={memory.photo}
                        alt={`Memory ${i + 1}`}
                        className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg object-cover border-2 border-gray-200"
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
                        className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg bg-gray-200 flex items-center justify-center text-gray-500 text-xs"
                        style={{ display: 'none' }}
                      >
                        Image Error
                      </div>
                      <button
                        onClick={() => {
                          const updated = { ...data };
                          updated.memories = [...updated.memories];
                          updated.memories[i] = { ...updated.memories[i], photo: '' };
                          setData(updated);
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                        type="button"
                      >
                        ×
                      </button>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const currentImages = data.memories.filter(m => m.photo).length;
                        if (currentImages >= 3 && !memory.photo) {
                          setMessage("Maximum 3 images allowed total.");
                          return;
                        }
                        handleImageUpload(e, i);
                      }}
                      disabled={uploading}
                      className="text-sm text-gray-500 w-full sm:w-auto"
                    />
                    {uploading && <span className="text-sm text-blue-500">Uploading...</span>}
                  </div>
                </div>
              </Field>
            </div>
          ))}
        </Section>

        {/* Final Section */}
        <Section title="Final Celebration">
          <Field label="Final Message">
            <input
              type="text"
              value={data.finalMessage}
              onChange={(e) => updateField("finalMessage", e.target.value)}
              className="editor-input"
            />
          </Field>
          <Field label="Personal Note">
            <textarea
              value={data.personalNote}
              onChange={(e) => updateField("personalNote", e.target.value)}
              className="editor-input min-h-15 resize-y"
              rows={2}
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
            />
          </Field>
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 space-y-4">
      <h2 className="text-base sm:text-lg font-semibold text-gray-800 border-b border-gray-100 pb-2">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
