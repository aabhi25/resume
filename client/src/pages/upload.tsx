import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUpload } from "@/components/ui/file-upload";
import { ProgressSteps } from "@/components/ui/progress-steps";
import { useToast } from "@/hooks/use-toast";
import { Zap, ArrowLeft, ArrowRight } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Upload() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [jobDescriptionText, setJobDescriptionText] = useState("");
  const [jobDescriptionFile, setJobDescriptionFile] = useState<File | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState("file");

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Upload failed");
      }
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate all queries to ensure fresh data on next page
      queryClient.invalidateQueries();
      toast({
        title: "Files uploaded successfully!",
        description: "Your files have been processed and parsed.",
      });
      setLocation(`/process/${data.jobId}`);
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async () => {
    // Validation
    if (!resumeFile) {
      toast({
        title: "Resume required",
        description: "Please upload your resume file.",
        variant: "destructive",
      });
      return;
    }

    if (!jobDescriptionFile && !jobDescriptionText.trim()) {
      toast({
        title: "Job description required",
        description: "Please provide a job description either by file upload or text input.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("resume", resumeFile);
    
    if (jobDescriptionFile) {
      formData.append("jobDescription", jobDescriptionFile);
    } else {
      formData.append("jobDescriptionText", jobDescriptionText);
    }

    uploadMutation.mutate(formData);
  };

  const isFormValid = resumeFile && (jobDescriptionFile || jobDescriptionText.trim());

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <nav className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">AI Resume Generator</h1>
                <p className="text-sm text-muted-foreground">Transform your resume with AI</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" data-testid="button-help">
                Help
              </Button>
              <Button size="sm" data-testid="button-signin">
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <ProgressSteps currentStep={1} />

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-4">
              Upload Your Files
            </h1>
            <p className="text-lg text-muted-foreground">
              Upload your current resume and the job description you're targeting
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Job Description Upload */}
            <Card data-testid="card-job-description">
              <CardHeader>
                <CardTitle>Job Description</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="file" data-testid="tab-file">Upload File</TabsTrigger>
                    <TabsTrigger value="text" data-testid="tab-text">Paste Text</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="file" className="mt-4">
                    <FileUpload
                      onFileSelect={setJobDescriptionFile}
                      accept=".pdf,.docx,.txt"
                      placeholder="Drop your job description file here"
                      description="Supports PDF, DOCX, and TXT files"
                      data-testid="upload-job-description"
                    />
                  </TabsContent>
                  
                  <TabsContent value="text" className="mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="jobDescription">Job Description Text</Label>
                      <Textarea
                        id="jobDescription"
                        placeholder="Paste the job description here..."
                        className="min-h-[200px]"
                        value={jobDescriptionText}
                        onChange={(e) => setJobDescriptionText(e.target.value)}
                        data-testid="textarea-job-description"
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Resume Upload */}
            <Card data-testid="card-resume">
              <CardHeader>
                <CardTitle>Current Resume</CardTitle>
              </CardHeader>
              <CardContent>
                <FileUpload
                  onFileSelect={setResumeFile}
                  accept=".pdf,.docx,.txt"
                  placeholder="Drop your resume file here"
                  description="Supports PDF, DOCX, and TXT files"
                  data-testid="upload-resume"
                />
              </CardContent>
            </Card>
          </div>

          {/* Upload Progress */}
          {uploadMutation.isPending && (
            <Card className="mt-8" data-testid="card-upload-progress">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Uploading and processing files...</span>
                      <span className="text-sm text-muted-foreground">Please wait</span>
                    </div>
                    <Progress value={50} className="h-2" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  We're extracting text from your files and parsing your resume structure.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Bottom Actions */}
          <div className="mt-8 flex items-center justify-between bg-card rounded-lg border border-border p-6">
            <Button 
              variant="outline" 
              onClick={() => setLocation("/")}
              data-testid="button-back-home"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-muted-foreground">
                {isFormValid ? "Ready to proceed" : "Please upload required files"}
              </div>
              <Button
                onClick={handleSubmit}
                disabled={!isFormValid || uploadMutation.isPending}
                data-testid="button-continue-process"
              >
                {uploadMutation.isPending ? "Processing..." : "Continue to Processing"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
