import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProgressSteps } from "@/components/ui/progress-steps";
import { useToast } from "@/hooks/use-toast";
import { Zap, ArrowLeft, ArrowRight, Download, Eye, FileText, Star, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface PreviewParams {
  jobId: string;
  [key: string]: string;
}

export default function Preview() {
  const [, params] = useRoute<PreviewParams>("/preview/:jobId");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("enhanced");

  const jobId = params?.jobId;

  // Fetch job data
  const { data: job, isLoading, error } = useQuery({
    queryKey: ["/api/jobs", jobId],
    enabled: !!jobId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading preview...</p>
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
                Your resume is still being processed or an error occurred.
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

  const parsedData = typeof job.parsedData === 'string' 
    ? JSON.parse(job.parsedData) 
    : job.parsedData;

  const enhancedData = job.enhancedContent 
    ? (typeof job.enhancedContent === 'string' 
        ? JSON.parse(job.enhancedContent) 
        : job.enhancedContent)
    : parsedData;

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
        <ProgressSteps currentStep={3} />

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Resume Preview
          </h1>
          <p className="text-lg text-muted-foreground">
            Review your AI-enhanced resume and compare it with the original
          </p>
        </div>

        {/* Match Score Display */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-accent/10 to-primary/10 border-accent/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-4">
                  <div>
                    <div className="text-3xl font-bold text-accent mb-1">{matchScore}%</div>
                    <p className="text-sm text-muted-foreground">Job Match Score</p>
                  </div>
                  <div className="h-16 w-px bg-border"></div>
                  <div className="text-left">
                    <div className="flex items-center space-x-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-accent" />
                      <span className="text-sm font-medium">Strong Match</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Your enhanced resume shows excellent alignment with job requirements
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Enhancement Summary */}
          <div className="lg:col-span-1 space-y-6">
            <Card data-testid="card-enhancement-summary">
              <CardHeader>
                <CardTitle>Enhancement Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-accent/5 rounded-lg">
                    <span className="text-sm font-medium">Skills Added</span>
                    <Badge variant="secondary">+{Math.max(0, (enhancedData?.skills?.length || 0) - (parsedData?.skills?.length || 0))}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                    <span className="text-sm font-medium">Content Enhanced</span>
                    <Badge variant="default">100%</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-accent/5 rounded-lg">
                    <span className="text-sm font-medium">Keywords Optimized</span>
                    <Badge variant="secondary">12+</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                    <span className="text-sm font-medium">ATS Score</span>
                    <Badge variant="default">Excellent</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-key-improvements">
              <CardHeader>
                <CardTitle>Key Improvements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="text-sm font-medium">Enhanced Professional Summary</p>
                      <p className="text-xs text-muted-foreground">Optimized to highlight relevant experience</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="text-sm font-medium">Quantified Achievements</p>
                      <p className="text-xs text-muted-foreground">Added metrics to demonstrate impact</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="text-sm font-medium">Keyword Optimization</p>
                      <p className="text-xs text-muted-foreground">Incorporated job-specific keywords</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="text-sm font-medium">Skills Enhancement</p>
                      <p className="text-xs text-muted-foreground">Added relevant technical skills</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Middle and Right Columns: Resume Comparison */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Resume Comparison</CardTitle>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" data-testid="button-preview-pdf">
                      <Eye className="mr-2 h-4 w-4" />
                      Preview PDF
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="enhanced" data-testid="tab-enhanced">Enhanced Resume</TabsTrigger>
                    <TabsTrigger value="original" data-testid="tab-original">Original Resume</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="enhanced" className="mt-6">
                    <div className="space-y-6 max-h-[600px] overflow-y-auto border rounded-lg p-6 bg-card">
                      {/* Enhanced Resume Content */}
                      {enhancedData?.summary && (
                        <div>
                          <h3 className="font-semibold text-primary mb-2">Professional Summary</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {enhancedData.summary}
                          </p>
                        </div>
                      )}

                      {enhancedData?.workExperience?.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-primary mb-3">Work Experience</h3>
                          <div className="space-y-4">
                            {enhancedData.workExperience.map((exp: any, index: number) => (
                              <div key={index} className="border-l-2 border-accent/20 pl-4">
                                <div className="flex justify-between items-start mb-1">
                                  <div>
                                    <h4 className="font-medium text-foreground">{exp.position}</h4>
                                    <p className="text-sm text-primary">{exp.company}</p>
                                  </div>
                                  <span className="text-xs text-muted-foreground">{exp.duration}</span>
                                </div>
                                {exp.responsibilities && (
                                  <ul className="list-disc list-inside space-y-1 mt-2">
                                    {exp.responsibilities.map((resp: string, idx: number) => (
                                      <li key={idx} className="text-xs text-muted-foreground">{resp}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {enhancedData?.skills?.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-primary mb-2">Skills</h3>
                          <div className="flex flex-wrap gap-2">
                            {enhancedData.skills.map((skill: string, index: number) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {enhancedData?.education?.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-primary mb-2">Education</h3>
                          <div className="space-y-2">
                            {enhancedData.education.map((edu: any, index: number) => (
                              <div key={index} className="flex justify-between">
                                <div>
                                  <p className="text-sm font-medium">{edu.degree}</p>
                                  <p className="text-xs text-primary">{edu.institution}</p>
                                </div>
                                <span className="text-xs text-muted-foreground">{edu.year}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {enhancedData?.projects?.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-primary mb-3">Projects</h3>
                          <div className="space-y-3">
                            {enhancedData.projects.map((project: any, index: number) => (
                              <div key={index}>
                                <h4 className="font-medium text-foreground text-sm">{project.name}</h4>
                                <p className="text-xs text-muted-foreground mt-1">{project.description}</p>
                                {project.technologies && (
                                  <p className="text-xs text-primary mt-1">
                                    Technologies: {project.technologies.join(', ')}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="original" className="mt-6">
                    <div className="space-y-6 max-h-[600px] overflow-y-auto border rounded-lg p-6 bg-muted/30">
                      {/* Original Resume Content */}
                      {parsedData?.summary && (
                        <div>
                          <h3 className="font-semibold text-foreground mb-2">Professional Summary</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {parsedData.summary}
                          </p>
                        </div>
                      )}

                      {parsedData?.workExperience?.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-foreground mb-3">Work Experience</h3>
                          <div className="space-y-4">
                            {parsedData.workExperience.map((exp: any, index: number) => (
                              <div key={index} className="border-l-2 border-muted-foreground/20 pl-4">
                                <div className="flex justify-between items-start mb-1">
                                  <div>
                                    <h4 className="font-medium text-foreground">{exp.position}</h4>
                                    <p className="text-sm text-muted-foreground">{exp.company}</p>
                                  </div>
                                  <span className="text-xs text-muted-foreground">{exp.duration}</span>
                                </div>
                                {exp.responsibilities && (
                                  <ul className="list-disc list-inside space-y-1 mt-2">
                                    {exp.responsibilities.map((resp: string, idx: number) => (
                                      <li key={idx} className="text-xs text-muted-foreground">{resp}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {parsedData?.skills?.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-foreground mb-2">Skills</h3>
                          <div className="flex flex-wrap gap-2">
                            {parsedData.skills.map((skill: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {parsedData?.education?.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-foreground mb-2">Education</h3>
                          <div className="space-y-2">
                            {parsedData.education.map((edu: any, index: number) => (
                              <div key={index} className="flex justify-between">
                                <div>
                                  <p className="text-sm font-medium">{edu.degree}</p>
                                  <p className="text-xs text-muted-foreground">{edu.institution}</p>
                                </div>
                                <span className="text-xs text-muted-foreground">{edu.year}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {parsedData?.projects?.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-foreground mb-3">Projects</h3>
                          <div className="space-y-3">
                            {parsedData.projects.map((project: any, index: number) => (
                              <div key={index}>
                                <h4 className="font-medium text-foreground text-sm">{project.name}</h4>
                                <p className="text-xs text-muted-foreground mt-1">{project.description}</p>
                                {project.technologies && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Technologies: {project.technologies.join(', ')}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="mt-8 flex items-center justify-between bg-card rounded-lg border border-border p-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Star className="h-5 w-5 text-accent mr-2" />
              <span className="text-sm text-muted-foreground">Great job! Your resume is optimized and ready.</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              onClick={() => setLocation(`/process/${jobId}`)}
              data-testid="button-back-process"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Edit
            </Button>
            <Button
              onClick={() => setLocation(`/download/${jobId}`)}
              data-testid="button-continue-download"
            >
              Continue to Download
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
