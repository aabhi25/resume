import React, { useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Upload, File, X } from 'lucide-react';
import { Button } from './button';

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  accept?: string;
  placeholder?: string;
  description?: string;
  className?: string;
  'data-testid'?: string;
}

export function FileUpload({
  onFileSelect,
  accept = "*/*",
  placeholder = "Drop your file here",
  description = "Drag and drop a file or click to browse",
  className,
  'data-testid': testId,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      onFileSelect(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      onFileSelect(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn("w-full", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
        data-testid={testId ? `${testId}-input` : undefined}
      />
      
      {selectedFile ? (
        // File selected state
        <div 
          className="border-2 border-dashed border-accent rounded-lg p-6 bg-accent/5"
          data-testid={testId}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <File className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveFile}
              className="text-muted-foreground hover:text-foreground"
              data-testid={testId ? `${testId}-remove` : undefined}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        // Upload zone
        <div
          className={cn(
            "border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer transition-all duration-200",
            "hover:border-primary hover:bg-primary/5",
            isDragOver && "border-primary bg-primary/5",
            className
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          data-testid={testId}
        >
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground mb-1">{placeholder}</p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              data-testid={testId ? `${testId}-browse` : undefined}
            >
              Browse Files
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
