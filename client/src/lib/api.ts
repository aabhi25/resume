import { apiRequest } from "./queryClient";

export interface UploadResponse {
  jobId: string;
  parsedData: any;
}

export interface GenerateRequest {
  jobId: string;
  mode: "template" | "preserve";
  template?: string;
}

export interface GenerateResponse {
  job: any;
  matchScore: number;
  enhancedContent: string;
}

export interface JobResponse {
  id: string;
  jobDescription: string;
  originalResume: string;
  parsedData: any;
  generationMode: string;
  selectedTemplate?: string;
  enhancedContent?: string;
  matchScore?: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export const api = {
  // Upload files and create new job
  uploadFiles: async (formData: FormData): Promise<UploadResponse> => {
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || "Upload failed");
    }
    
    return response.json();
  },

  // Generate enhanced resume
  generateResume: async (data: GenerateRequest): Promise<GenerateResponse> => {
    const response = await apiRequest("POST", "/api/generate", data);
    return response.json();
  },

  // Get job by ID
  getJob: async (jobId: string): Promise<JobResponse> => {
    const response = await fetch(`/api/jobs/${jobId}`, {
      method: "GET",
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      },
      credentials: "include",
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || "Failed to get job");
    }
    
    return response.json();
  },

  // Download resume in specified format
  downloadResume: async (jobId: string, format: string): Promise<Blob> => {
    const response = await fetch(`/api/download/${jobId}/${format}`);
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || "Download failed");
    }
    
    return response.blob();
  },

  // Preview resume (returns HTML for iframe)
  previewResume: async (jobId: string): Promise<string> => {
    const response = await fetch(`/api/preview/${jobId}`);
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || "Preview failed");
    }
    
    return response.text();
  },
};
