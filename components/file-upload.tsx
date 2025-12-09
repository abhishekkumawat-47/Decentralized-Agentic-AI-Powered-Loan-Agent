"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import gsap from "gsap"
import { Upload, FileCheck } from "lucide-react"

interface FileUploadProps {
  onFileSelect: (file: File) => void
  documentType: string
}

export function FileUpload({ onFileSelect, documentType }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const dropRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    gsap.fromTo(
      dropRef.current,
      { scale: 0.95, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.7)" },
    )
  }, [])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      setSelectedFile(file)
      onFileSelect(file)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      onFileSelect(file)
    }
  }

  return (
    <div
      ref={dropRef}
      className={`
        p-6 rounded-xl border-2 border-dashed transition-colors cursor-pointer
        ${isDragging ? "border-primary bg-primary/10" : "border-border bg-card/50"}
        ${selectedFile ? "border-green-500 bg-green-500/10" : ""}
      `}
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input ref={inputRef} type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileChange} />

      <div className="flex flex-col items-center gap-3 text-center">
        {selectedFile ? (
          <>
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <FileCheck className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">Click to change file</p>
            </div>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Upload your {documentType}</p>
              <p className="text-xs text-muted-foreground">Drag & drop or click to browse</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
