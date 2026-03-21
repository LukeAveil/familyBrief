"use client";

import { useRef, useState } from "react";
import { getAccessToken } from "@/services/authClient";
import type { Event } from "@/types";

type Props = {
  onSuccess?: () => void;
};

export default function ImageUploadButton({ onSuccess }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    count: number;
    items: { title: string; date: string }[];
  } | null>(null);

  const uploadFile = async (file: File) => {
    setError(null);
    setResult(null);

    const token = await getAccessToken();
    if (!token) {
      setError("Please sign in to upload.");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/parse-image", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        events?: Event[];
        count?: number;
      };

      if (!res.ok) {
        const msg =
          typeof body.error === "string"
            ? body.error
            : "Upload failed. Please try again.";
        setError(msg);
        return;
      }

      const events = body.events ?? [];
      const count =
        typeof body.count === "number" ? body.count : events.length;

      setResult({
        count,
        items: events.map((e) => ({ title: e.title, date: e.date })),
      });
      onSuccess?.();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void uploadFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) void uploadFile(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const showList = result && result.items.length > 0;
  const moreCount =
    result && result.count > 6 ? result.count - 6 : 0;

  return (
    <div className="image-upload">
      <div
        className="image-upload-inner"
        onDrop={onDrop}
        onDragOver={onDragOver}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.pdf"
          className="image-upload-sr-only"
          onChange={onChange}
          disabled={loading}
          id="dashboard-image-upload"
          aria-label="Upload photo or PDF to add calendar events"
        />
        <button
          type="button"
          className="btn-outline"
          disabled={loading}
          aria-busy={loading}
          onClick={() => inputRef.current?.click()}
        >
          {loading ? "Processing…" : "Upload flyer"}
        </button>
      </div>

      {error && (
        <p className="image-upload-msg image-upload-error" role="alert">
          {error}
        </p>
      )}

      {result && (
        <div
          className="image-upload-msg image-upload-success"
          aria-live="polite"
        >
          <p className="image-upload-count">
            {result.count === 0
              ? "No events found in that file."
              : `${result.count} event${result.count === 1 ? "" : "s"} found`}
          </p>
          {showList && (
            <ul className="image-upload-list">
              {result.items.slice(0, 6).map((row, i) => (
                <li key={`${row.date}-${row.title}-${i}`}>
                  <span className="image-upload-list-title">{row.title}</span>
                  <span className="image-upload-list-date">{row.date}</span>
                </li>
              ))}
            </ul>
          )}
          {moreCount > 0 && (
            <p className="image-upload-more">+ {moreCount} more</p>
          )}
        </div>
      )}
    </div>
  );
}
