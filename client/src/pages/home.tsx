import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Upload, Zap, Download, CheckCircle, Star } from "lucide-react";

export default function Home() {
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

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Transform Your Resume with{" "}
            <span className="text-primary">AI Power</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Upload your resume and job description. Our AI will enhance your content, 
            optimize for ATS systems, and create a professional resume that gets noticed.
          </p>
          <Link href="/upload">
            <Button size="lg" className="text-lg px-8 py-6" data-testid="button-get-started">
              <Upload className="mr-2 h-5 w-5" />
              Get Started Now
            </Button>
          </Link>
        </div>

        {/* How It Works */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <Card className="text-center" data-testid="card-step-1">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">1. Upload Files</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Upload your current resume and the job description you're targeting
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center" data-testid="card-step-2">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">2. AI Processing</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Our AI analyzes the job requirements and enhances your resume content
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center" data-testid="card-step-3">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">3. Choose Format</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Select a professional template or preserve your original formatting
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center" data-testid="card-step-4">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Download className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">4. Download</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Preview and download your enhanced resume in PDF or DOCX format
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card data-testid="card-feature-ai">
              <CardHeader>
                <CheckCircle className="h-8 w-8 text-accent mb-2" />
                <CardTitle>AI-Powered Enhancement</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Uses advanced LLaMA models to rewrite and optimize your resume content for maximum impact
                </CardDescription>
              </CardContent>
            </Card>

            <Card data-testid="card-feature-ats">
              <CardHeader>
                <CheckCircle className="h-8 w-8 text-accent mb-2" />
                <CardTitle>ATS Optimization</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Optimizes keywords and formatting to pass Applicant Tracking Systems
                </CardDescription>
              </CardContent>
            </Card>

            <Card data-testid="card-feature-templates">
              <CardHeader>
                <CheckCircle className="h-8 w-8 text-accent mb-2" />
                <CardTitle>Professional Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Choose from modern, classic, creative, and executive resume templates
                </CardDescription>
              </CardContent>
            </Card>

            <Card data-testid="card-feature-matching">
              <CardHeader>
                <CheckCircle className="h-8 w-8 text-accent mb-2" />
                <CardTitle>Job Matching</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Analyzes job descriptions to highlight relevant skills and experience
                </CardDescription>
              </CardContent>
            </Card>

            <Card data-testid="card-feature-formats">
              <CardHeader>
                <CheckCircle className="h-8 w-8 text-accent mb-2" />
                <CardTitle>Multiple Formats</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Download in PDF, DOCX, or HTML formats while preserving professional formatting
                </CardDescription>
              </CardContent>
            </Card>

            <Card data-testid="card-feature-preserve">
              <CardHeader>
                <CheckCircle className="h-8 w-8 text-accent mb-2" />
                <CardTitle>Format Preservation</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Option to keep your original formatting while only enhancing the content
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-primary/5 rounded-lg p-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to Create Your Perfect Resume?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of job seekers who have enhanced their resumes with AI
          </p>
          <Link href="/upload">
            <Button size="lg" className="text-lg px-8 py-6" data-testid="button-start-now">
              <Star className="mr-2 h-5 w-5" />
              Start Now - It's Free
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
