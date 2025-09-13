import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ProgressSteps } from "@/components/ui/progress-steps";
import { TemplateSelector } from "@/components/ui/template-selector";
import { LoadingModal } from "@/components/ui/loading-modal";
import { useToast } from "@/hooks/use-toast";
import { Zap, ArrowLeft, ArrowRight, CheckCircle, Info } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ProcessParams {
  jobId: string;
  [key: string]: string;
}

export default function Process() {
  const [, params] = useRoute<ProcessParams>("/process/:jobId");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [generationMode, setGenerationMode] = useState("template");
  const [selectedTemplate, setSelectedTemplate] = useState("modern");
  const [isGenerating, setIsGenerating] = useState(false);

  const jobId = params?.jobId;

  // Fetch job data
  const { data: job, isLoading, error } = useQuery({
    queryKey: ["/api/jobs", jobId],
    enabled: !!jobId,
  });

  const generateMutation = useMutation({
    mutationFn: async (data: { jobId: string; mode: string; template?: string }) => {
      const response = await apiRequest("POST", "/api/generate", data);
      return response.json();
    },
    onSuccess: (data) => {
      setIsGenerating(false);
      toast({
        title: "Resume enhanced successfully!",
        description: "Your resume has been processed and enhanced with AI.",
      });
      setLocation(`/preview/${jobId}`);
    },
    onError: (error) => {
      setIsGenerating(false);
      toast({
        title: "Generation failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!jobId) return;
    
    setIsGenerating(true);
    generateMutation.mutate({
      jobId,
      mode: generationMode,
      template: generationMode === "template" ? selectedTemplate : undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading job data...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-red-500 mb-4">
                <Info className="h-8 w-8 mx-auto" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Job Not Found</h2>
              <p className="text-muted-foreground mb-4">
                The job you're looking for doesn't exist or has been deleted.
              </p>
              <Button onClick={() => setLocation("/upload")}>
                Start New Job
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const parsedData = typeof job.parsedData === 'string' 
    ? JSON.parse(job.parsedData) 
    : job.parsedData;

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
        <ProgressSteps currentStep={2} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Parsed Resume Data */}
          <div className="lg:col-span-1">
            <Card data-testid="card-parsed-data">
              <CardHeader>
                <CardTitle>Parsed Resume Data</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-sm font-medium text-foreground">Summary</span>
                    {parsedData?.summary ? (
                      <CheckCircle className="h-4 w-4 text-accent" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-muted-foreground" />
                    )}
                  </div>
                  {parsedData?.summary && (
                    <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                      {parsedData.summary.slice(0, 120)}...
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-sm font-medium text-foreground">Work Experience</span>
                    {parsedData?.workExperience?.length > 0 ? (
                      <Badge variant="secondary" className="bg-accent/10 text-accent">
                        {parsedData.workExperience.length} positions
                      </Badge>
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-muted-foreground" />
                    )}
                  </div>
                  {parsedData?.workExperience?.length > 0 && (
                    <div className="space-y-1">
                      {parsedData.workExperience.slice(0, 2).map((exp: any, index: number) => (
                        <div key={index} className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                          <div className="font-medium">{exp.position}</div>
                          <div>{exp.company} | {exp.duration}</div>
                        </div>
                      ))}
                      {parsedData.workExperience.length > 2 && (
                        <div className="text-xs text-center text-muted-foreground">
                          +{parsedData.workExperience.length - 2} more positions...
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-sm font-medium text-foreground">Education</span>
                    {parsedData?.education?.length > 0 ? (
                      <Badge variant="secondary" className="bg-accent/10 text-accent">
                        {parsedData.education.length} degrees
                      </Badge>
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-muted-foreground" />
                    )}
                  </div>
                  {parsedData?.education?.length > 0 && (
                    <div className="space-y-1">
                      {parsedData.education.map((edu: any, index: number) => (
                        <div key={index} className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                          <div className="font-medium">{edu.degree}</div>
                          <div>{edu.institution} | {edu.year}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-sm font-medium text-foreground">Skills</span>
                    {parsedData?.skills?.length > 0 ? (
                      <Badge variant="secondary" className="bg-accent/10 text-accent">
                        {parsedData.skills.length} skills
                      </Badge>
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-muted-foreground" />
                    )}
                  </div>
                  {parsedData?.skills?.length > 0 && (
                    <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                      {parsedData.skills.slice(0, 5).join(', ')}
                      {parsedData.skills.length > 5 && `, +${parsedData.skills.length - 5} more...`}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium text-foreground">Projects</span>
                    {parsedData?.projects?.length > 0 ? (
                      <Badge variant="secondary" className="bg-accent/10 text-accent">
                        {parsedData.projects.length} projects
                      </Badge>
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-muted-foreground" />
                    )}
                  </div>
                  {parsedData?.projects?.length > 0 && (
                    <div className="space-y-1">
                      {parsedData.projects.slice(0, 2).map((project: any, index: number) => (
                        <div key={index} className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                          <div className="font-medium">{project.name}</div>
                          <div>{project.description?.slice(0, 80)}...</div>
                        </div>
                      ))}
                      {parsedData.projects.length > 2 && (
                        <div className="text-xs text-center text-muted-foreground">
                          +{parsedData.projects.length - 2} more projects...
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Template & Mode Selection */}
          <div className="lg:col-span-1 space-y-6">
            {/* Template Selection */}
            {generationMode === "template" && (
              <Card data-testid="card-template-selection">
                <CardHeader>
                  <CardTitle>Choose Template</CardTitle>
                </CardHeader>
                <CardContent>
                  <TemplateSelector 
                    selectedTemplate={selectedTemplate}
                    onTemplateSelect={setSelectedTemplate}
                  />
                </CardContent>
              </Card>
            )}

            {/* Mode Selection */}
            <Card data-testid="card-mode-selection">
              <CardHeader>
                <CardTitle>Generation Mode</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup 
                  value={generationMode} 
                  onValueChange={setGenerationMode}
                  className="space-y-4"
                >
                  {/* Template Mode */}
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="template" id="template" />
                    <Label htmlFor="template" className="flex-1 cursor-pointer">
                      <div className={`border-2 rounded-lg p-4 transition-colors ${
                        generationMode === "template" 
                          ? "border-primary bg-primary/5" 
                          : "border-border"
                      }`}>
                        <div className="flex items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground">Use Professional Template</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              Generate a new resume using our professionally designed templates with AI-enhanced content.
                            </p>
                            <div className="flex items-center mt-2">
                              <Badge variant="default" className="mr-2">Recommended</Badge>
                              <span className="text-xs text-muted-foreground">• ATS-friendly • Modern design</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Label>
                  </div>

                  {/* Preserve Format Mode */}
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="preserve" id="preserve" />
                    <Label htmlFor="preserve" className="flex-1 cursor-pointer">
                      <div className={`border-2 rounded-lg p-4 transition-colors ${
                        generationMode === "preserve" 
                          ? "border-primary bg-primary/5" 
                          : "border-border"
                      }`}>
                        <div className="flex items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground">Preserve Original Format</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              Keep your current resume layout and only enhance the content with AI improvements.
                            </p>
                            <div className="flex items-center mt-2">
                              <span className="text-xs text-muted-foreground">• Maintains formatting • Content-only changes</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>

                <Button 
                  className="w-full mt-6" 
                  onClick={handleGenerate}
                  disabled={generateMutation.isPending}
                  data-testid="button-generate-resume"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Generate Enhanced Resume
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="mt-8 flex items-center justify-between bg-card rounded-lg border border-border p-6">
          <div className="flex items-center">
            <Info className="h-5 w-5 text-primary mr-2" />
            <span className="text-sm text-muted-foreground">Generation will take 30-60 seconds</span>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              onClick={() => setLocation("/upload")}
              data-testid="button-back-upload"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Upload
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={!jobId || generateMutation.isPending}
              data-testid="button-continue-preview"
            >
              {generateMutation.isPending ? "Processing..." : "Continue to Preview"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Loading Modal */}
      <LoadingModal 
        isOpen={isGenerating}
        title="AI is enhancing your resume..."
        description="This may take up to 60 seconds"
        steps={[
          { label: "Analyzing job requirements", status: "completed" },
          { label: "Enhancing content with AI", status: "active" },
          { label: "Applying template formatting", status: "pending" }
        ]}
        progress={45}
      />
    </div>
  );
}
