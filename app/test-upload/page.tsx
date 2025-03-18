"use client";

import { useState } from "react";
import * as Bytescale from "@bytescale/sdk";
import Dropzone from "react-dropzone";

export default function TestUpload() {
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const uploadManager = new Bytescale.UploadManager({
    apiKey: process.env.NEXT_PUBLIC_BYTESCALE_API_KEY || "free"
  });

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setError(null);
    
    try {
      console.log("Starting upload with Bytescale...");
      const { fileUrl } = await uploadManager.upload({
        data: file,
        mime: file.type,
        originalFileName: file.name,
      });
      
      console.log("Upload successful:", fileUrl);
      setUploadedUrl(fileUrl);
    } catch (err) {
      console.error("Upload failed:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Bytescale Upload Test</h1>
      
      <div className="mb-8">
        <Dropzone
          accept={{
            "image/*": [".jpg", ".jpeg", ".png"],
          }}
          multiple={false}
          onDrop={(acceptedFiles) => handleUpload(acceptedFiles[0])}
        >
          {({ getRootProps, getInputProps, isDragActive }) => (
            <div
              {...getRootProps()}
              className={`p-8 border-2 border-dashed rounded-lg text-center cursor-pointer ${
                isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
              }`}
            >
              <input {...getInputProps()} />
              {isUploading ? (
                <p className="text-gray-500">Uploading...</p>
              ) : (
                <p className="text-gray-500">
                  Drag and drop an image here, or click to select a file
                </p>
              )}
            </div>
          )}
        </Dropzone>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-600">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {uploadedUrl && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-3">Uploaded Image:</h2>
          <div className="border rounded-lg overflow-hidden">
            <img src={uploadedUrl} alt="Uploaded file" className="w-full" />
          </div>
          <p className="mt-2 text-sm text-gray-500 break-all">{uploadedUrl}</p>
        </div>
      )}
    </div>
  );
} 