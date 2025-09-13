import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ProgressSteps } from "@/components/ui/progress-steps";
import { useToast } from "@/hooks/use-toast";
import { Zap, ArrowLeft, Download, FileText, File, Check, Star, Heart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface DownloadParams {
  jobId: string;
  [key: string]: string;
}

export default function DownloadPage() {
  const [, params] = useRoute<DownloadParams>("/download/:jobId");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [downloadFormat, setDownloadFormat] = useState("pdf");
  const [isDownloading, setIsDownloading] = useState(false);

  const jobId = params?.jobId;

  // Fetch job data
  const { data: job, isLoading, error } = useQuery({
    queryKey: ["/api/jobs", jobId],
    enabled: !!jobId,
  });

  const handleDownload = async (format: string) => {
    if (!jobId) return;
    
    setIsDownloading(true);
    try {
      const response = await fetch(`/api/download/${jobId}/${format}`);
      if (!response.ok) throw new Error('Download failed');
      
      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `enhanced_resume.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Download successful!",
        description: `Your resume has been downloaded as ${format.toUpperCase()}.`,
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading download options...</p>
        </div>
      </div>
    );
  }

  if (error || !job || job.status !== 'completed') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-red-500 mb-4">
                <FileText className="h-8 w-8 mx-auto" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Resume Not Ready</h2>
              <p className="text-muted-foreground mb-4">
                Your resume is not ready for download yet.
              </p>
              <Button onClick={() => setLocation(`/process/${jobId}`)}>
                Back to Processing
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const matchScore = job.matchScore || 85;

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
        <ProgressSteps currentStep={4} />

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-accent/10 rounded-full mb-4">
                <Check className="h-8 w-8 text-accent" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">
              Your Resume is Ready!
            </h1>
            <p className="text-lg text-muted-foreground">
              Your AI-enhanced resume has been successfully generated and optimized for your target job
            </p>
          </div>

          {/* Success Summary */}
          <Card className="mb-8 bg-gradient-to-r from-accent/5 to-primary/5 border-accent/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <div className="text-2xl font-bold text-accent mb-1">{matchScore}%</div>
                    <p className="text-sm text-muted-foreground">Job Match Score</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary mb-1">ATS</div>
                    <p className="text-sm text-muted-foreground">Optimized</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-accent mb-1">12+</div>
                    <p className="text-sm text-muted-foreground">Keywords Added</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Download Options */}
            <Card data-testid="card-download-options">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Download className="mr-2 h-5 w-5" />
                  Download Your Resume
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-sm font-medium mb-3 block">Choose Format</Label>
                  <RadioGroup value={downloadFormat} onValueChange={setDownloadFormat}>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="pdf" id="pdf" />
                        <Label htmlFor="pdf" className="flex-1 cursor-pointer">
                          <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/5 transition-colors">
                            <div className="flex items-center space-x-3">
                              <FileText className="h-5 w-5 text-red-500" />
                              <div>
                                <p className="font-medium">PDF Format</p>
                                <p className="text-xs text-muted-foreground">Best for job applications and ATS systems</p>
                              </div>
                            </div>
                            <Badge variant="default" className="bg-accent text-accent-foreground">
                              Recommended
                            </Badge>
                          </div>
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="docx" id="docx" />
                        <Label htmlFor="docx" className="flex-1 cursor-pointer">
                          <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/5 transition-colors">
                            <div className="flex items-center space-x-3">
                              <File className="h-5 w-5 text-blue-500" />
                              <div>
                                <p className="font-medium">DOCX Format</p>
                                <p className="text-xs text-muted-foreground">Editable Microsoft Word document</p>
                              </div>
                            </div>
                          </div>
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <Button 
                    className="w-full" 
                    onClick={() => handleDownload(downloadFormat)}
                    disabled={isDownloading}
                    data-testid="button-download"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {isDownloading ? "Preparing Download..." : `Download ${downloadFormat.toUpperCase()}`}
                  </Button>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => handleDownload("pdf")}
                      disabled={isDownloading}
                      data-testid="button-download-pdf"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      PDF
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleDownload("docx")}
                      disabled={isDownloading}
                      data-testid="button-download-docx"
                    >
                      <File className="mr-2 h-4 w-4" />
                      DOCX
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhancement Summary */}
            <Card data-testid="card-final-summary">
              <CardHeader>
                <CardTitle>What We've Enhanced</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center mt-0.5">
                      <Check className="h-3 w-3 text-accent-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Professional Summary</p>
                      <p className="text-xs text-muted-foreground">Rewritten to highlight your most relevant experience and skills</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center mt-0.5">
                      <Check className="h-3 w-3 text-accent-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Work Experience</p>
                      <p className="text-xs text-muted-foreground">Enhanced bullet points with quantified achievements</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center mt-0.5">
                      <Check className="h-3 w-3 text-accent-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Skills Section</p>
                      <p className="text-xs text-muted-foreground">Added relevant skills matching job requirements</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center mt-0.5">
                      <Check className="h-3 w-3 text-accent-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">ATS Optimization</p>
                      <p className="text-xs text-muted-foreground">Incorporated keywords for better applicant tracking system compatibility</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center mt-0.5">
                      <Check className="h-3 w-3 text-accent-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Professional Formatting</p>
                      <p className="text-xs text-muted-foreground">Applied modern template with clean, professional design</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Star className="h-4 w-4 text-accent" />
                      <span className="text-sm font-medium">Resume Enhancement Complete</span>
                      <Star className="h-4 w-4 text-accent" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Your resume is now optimized and ready to make a great first impression!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Actions */}
          <div className="mt-8 flex items-center justify-between bg-card rounded-lg border border-border p-6">
            <div className="flex items-center space-x-4">
              <Heart className="h-5 w-5 text-accent" />
              <div>
                <p className="text-sm font-medium">Thanks for using AI Resume Generator!</p>
                <p className="text-xs text-muted-foreground">We hope this helps you land your dream job.</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setLocation(`/preview/${jobId}`)}
                data-testid="button-back-preview"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Preview
              </Button>
              <Button
                onClick={() => setLocation("/")}
                data-testid="button-create-new"
              >
                Create New Resume
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
