"use client";

import React, { useEffect, useState, useCallback } from "react";
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
  const [errors] = useState<Record<string, string>>({});

  const getCredentials = useCallback(() => {
    const email = sessionStorage.getItem("owner_email");
    const template_code = sessionStorage.getItem("template_code");
    const storedUuid = sessionStorage.getItem("template_uuid");
    return { email, template_code, storedUuid };
  }, []);

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
          const { siteData } = await import("../../../data/siteData");
          setData({
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
          });
        } else {
          const templateData = result.data as TemplateData;
          templateData.memories = templateData.memories.slice(0, 3);
          templateData.memories = templateData.memories.map(m => ({
            ...m,
            photo: m.photo && m.photo.startsWith("http") ? m.photo : "",
          }));
          setData(templateData);
        }
        if (result.is_published) {
          setShareLink(`${window.location.origin}/w/${uuid}`);
        }
      } catch (error) {
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

    try {
      const res = await fetch("/api/template/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uuid, email, template_code, data }),
      });

      const result = await res.json();
      
      if (res.ok) {
        setMessage("Saved successfully!");
      } else {
        setMessage(result.error || "Failed to save");
      }
    } catch (err) {
      setMessage("Failed to save.");
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(""), 3000);
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
        setMessage("Published successfully!");
      } else {
        setMessage(result.error || "Failed to publish");
      }
    } catch {
      setMessage("Failed to publish.");
    } finally {
      setPublishing(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    memoryIndex: number
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

      const res = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (res.ok && result.url) {
        const updated = { ...data };
        updated.memories = [...updated.memories];
        updated.memories[memoryIndex] = {
          ...updated.memories[memoryIndex],
          photo: result.url,
        };
        setData(updated);
        setMessage("Image uploaded successfully!");
      } else {
        setMessage(result.error || "Upload failed.");
      }
    } catch (err) {
      setMessage("Failed to upload image.");
    } finally {
      setUploading(false);
      setTimeout(() => setMessage(""), 3000);
      e.target.value = '';
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
    <div className="min-h-screen bg-linear-to-br from-pink-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-800">
              ✏️ Template Editor
            </h1>
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="px-5 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50"
              >
                {publishing ? "Publishing..." : "Publish"}
              </button>
            </div>
          </div>
        </div>

        {/* Status message */}
        {message && (
          <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-700">
            {message}
          </div>
        )}

        {/* Share link */}
        {shareLink && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm font-medium text-green-800 mb-2">
              🔗 Share Link:
            </p>
            <div className="flex gap-2">
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Field label="Her Name">
              <input
                type="text"
                value={data.herName}
                onChange={(e) => updateField("herName", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter her beautiful name..."
              />
            </Field>
            <Field label="Headline">
              <input
                type="text"
                value={data.heroHeadline}
                onChange={(e) => updateField("heroHeadline", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="A powerful headline that celebrates her..."
              />
            </Field>
          </div>
          <Field label="Subtitle">
            <input
              type="text"
              value={data.heroSubtext}
              onChange={(e) => updateField("heroSubtext", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="A heartfelt subtitle that sets the tone..."
            />
          </Field>
          <Field label="Loading Text">
            <input
              type="text"
              value={data.heroLoading}
              onChange={(e) => updateField("heroLoading", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Text shown while the magic loads..."
            />
          </Field>
        </Section>

        {/* Impact Stats */}
        <Section title="Impact Stats">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {data.stats.map((stat, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-md font-medium text-gray-800 mb-3">Stat {i + 1}</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Label">
                      <input
                        type="text"
                        value={stat.label}
                        onChange={(e) => updateStat(i, "label", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Lives Impacted"
                      />
                    </Field>
                    <Field label="Value">
                      <input
                        type="number"
                        value={stat.value}
                        onChange={(e) =>
                          updateStat(i, "value", parseInt(e.target.value) || 0)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Over"
                      />
                    </Field>
                    <Field label="Suffix">
                      <input
                        type="text"
                        value={stat.suffix}
                        onChange={(e) => updateStat(i, "suffix", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., +, people"
                      />
                    </Field>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Superpowers */}
        <Section title="Superpowers">
          <div className="space-y-4">
            {data.superpowers.map((power, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex flex-col items-center gap-2">
                    <label className="text-sm font-medium text-gray-600">Icon:</label>
                    <input
                      type="text"
                      value={power.icon}
                      onChange={(e) => updateSuperpower(i, 'icon', e.target.value)}
                      className="w-16 h-16 text-center text-2xl border-2 border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      maxLength={2}
                      placeholder="💪"
                    />
                  </div>
                  <div className="flex-1">
                    <Field label={`Superpower ${i + 1}`}>
                      <textarea
                        value={power.text}
                        onChange={(e) => updateSuperpower(i, 'text', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-20 resize-y"
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
                    <Field label="Memory Description" required={true} error={errors[`memory_${i}_text`]}>
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
                                setMessage("Image removed successfully!");
                                setTimeout(() => setMessage(""), 3000);
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
                              <p className="text-xs text-gray-400 mt-1">Click below to add an image</p>
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
                                  setMessage("⚠️ Maximum 3 images allowed total. Please remove an existing image first.");
                                  setTimeout(() => setMessage(""), 4000);
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
                          <div className="text-xs text-gray-500 space-y-1">
                            <p>💡 Tip: Upload images under 1MB for best performance</p>
                            <p>📊 Images used: {data.memories.filter(m => m.photo).length} / 3 maximum</p>
                          </div>
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
            <Field label="Final Message" required={true}>
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 space-y-4">
      <div className="border-b border-gray-100 pb-2">
        <h2 className="text-lg font-semibold text-gray-800">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
    </div>
  );
}