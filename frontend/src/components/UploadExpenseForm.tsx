import React, { useRef, useState } from "react";

type Props = {
  expenseId: number;
  onUploaded?: (fileKey: string) => void;
};

export default function UploadExpenseForm({ expenseId, onUploaded }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccess(null);
    const f = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    setFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!file) {
      setError("Please select a file.");
      return;
    }

    setLoading(true);
    try {
      const signRes = await fetch("/api/upload/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ filename: file.name, type: file.type }),
      });

      if (!signRes.ok) {
        const txt = await signRes.text();
        throw new Error(`Failed to sign upload URL: ${txt || signRes.status}`);
      }

      const { uploadUrl, key } = await signRes.json();

      if (!uploadUrl || !key) {
        throw new Error("Invalid signing response");
      }

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!(uploadRes.ok || uploadRes.status === 200 || uploadRes.status === 204)) {
        const txt = await uploadRes.text().catch(() => "");
        throw new Error(`File upload failed: ${uploadRes.status} ${txt}`);
      }

      const updateRes = await fetch(`/api/expenses/${expenseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ fileKey: key }),
      });

      if (!updateRes.ok) {
        const txt = await updateRes.text();
        throw new Error(`Failed to update expense: ${txt || updateRes.status}`);
      }

      setSuccess("File uploaded and expense updated.");
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      if (onUploaded) onUploaded(key);
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>
          Upload file:
          <input ref={inputRef} type="file" onChange={handleFileChange} disabled={loading} />
        </label>
      </div>

      <div>
        <button type="submit" disabled={!file || loading}>
          {loading ? "Uploading..." : "Upload"}
        </button>
      </div>

      {error && (
        <div role="alert" style={{ color: "red", marginTop: 8 }}>
          {error}
        </div>
      )}

      {success && (
        <div role="status" style={{ color: "green", marginTop: 8 }}>
          {success}
        </div>
      )}
    </form>
  );
}
