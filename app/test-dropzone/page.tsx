"use client";

import { useState } from "react";
import Dropzone from "react-dropzone";
import * as Bytescale from "@bytescale/sdk";
import { Button } from "@/components/ui/button";

export default function TestDropzonePage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 初始化 Bytescale 上传管理器
  const uploadManager = new Bytescale.UploadManager({
    apiKey: process.env.NEXT_PUBLIC_BYTESCALE_API_KEY || "free"
  });
  
  const handleDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      console.log("File selected:", acceptedFiles[0].name);
    }
  };
  
  const handleUpload = async () => {
    if (!file) {
      setError("No file selected");
      return;
    }
    
    setIsUploading(true);
    setError(null);
    
    try {
      console.log("Starting upload to Bytescale...");
      const { fileUrl } = await uploadManager.upload({
        data: file,
        mime: file.type,
        originalFileName: file.name,
      });
      
      console.log("Upload successful, file URL:", fileUrl);
      setUploadedUrl(fileUrl);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Dropzone Test Page</h1>
      
      <div className="mb-8">
        <Dropzone
          accept={{
            "image/*": [".jpg", ".jpeg", ".png"],
          }}
          multiple={false}
          onDrop={handleDrop}
        >
          {({ getRootProps, getInputProps, isDragActive, open }) => (
            <div
              {...getRootProps()}
              className={`p-8 border-2 border-dashed rounded-lg text-center cursor-pointer ${
                isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                open();
              }}
            >
              <input {...getInputProps()} />
              <p className="text-gray-500">
                Drag and drop an image here, or click to select a file
              </p>
              {file && (
                <p className="mt-2 text-sm text-green-600">
                  Selected: {file.name} ({Math.round(file.size / 1024)} KB)
                </p>
              )}
            </div>
          )}
        </Dropzone>
        
        <div className="mt-4">
          <Button 
            onClick={handleUpload} 
            disabled={!file || isUploading}
            className="w-full"
          >
            {isUploading ? "Uploading..." : "Upload File"}
          </Button>
        </div>
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