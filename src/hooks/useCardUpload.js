import { useCallback, useState } from "react";
import { uploadBusinessCards } from "../api"; // adjust path if needed

export function useCardUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [response, setResponse] = useState(null);

  const upload = useCallback(async (files) => {
    setError("");
    setResponse(null);

    const fileList = Array.from(files || []);
    if (fileList.length === 0) {
      setError("Please select at least one image.");
      return null;
    }

    setIsUploading(true);
    try {
      const data = await uploadBusinessCards(fileList);
      setResponse(data);
      return data;
    } catch (e) {
      setError(e?.message || "Upload failed.");
      return null;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError("");
    setResponse(null);
    setIsUploading(false);
  }, []);

  return { upload, reset, isUploading, error, response };
}
