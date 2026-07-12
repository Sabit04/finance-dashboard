"use client";

import { useRef, useState } from "react";

interface CsvUploadProps {
  onFileSelected: (file: File) => void;
  isLoading: boolean;
}

export function CsvUpload({ onFileSelected, isLoading }: CsvUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) onFileSelected(file);
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        handleFiles(event.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
        isDragging ? "border-blue-400 bg-blue-50" : "border-gray-300 bg-gray-50 hover:bg-gray-100"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />
      <p className="text-sm font-medium text-gray-700">
        {isLoading ? "Categorizing transactions…" : "Drop a bank CSV here, or click to browse"}
      </p>
      <p className="mt-1 text-xs text-gray-500">
        Expects columns like Date, Description, and Amount
      </p>
    </div>
  );
}
