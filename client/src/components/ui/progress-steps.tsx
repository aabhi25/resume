import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface ProgressStepsProps {
  currentStep: number;
  className?: string;
}

const steps = [
  { id: 1, title: "Upload Files", description: "Upload resume and job description" },
  { id: 2, title: "Process & Select Mode", description: "AI processing and configuration" },
  { id: 3, title: "Preview Results", description: "Review enhanced resume" },
  { id: 4, title: "Download Resume", description: "Get your optimized resume" },
];

export function ProgressSteps({ currentStep, className }: ProgressStepsProps) {
  return (
    <div className={cn("mb-8", className)} data-testid="progress-steps">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all duration-300",
                    step.id < currentStep
                      ? "bg-accent text-accent-foreground" // Completed
                      : step.id === currentStep
                      ? "bg-primary text-primary-foreground" // Active
                      : "bg-muted text-muted-foreground" // Pending
                  )}
                  data-testid={`step-indicator-${step.id}`}
                >
                  {step.id < currentStep ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    step.id
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "h-1 w-16 mx-2 transition-all duration-300",
                      step.id < currentStep ? "bg-accent" : "bg-border"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-sm text-muted-foreground" data-testid="step-counter">
            Step {currentStep} of {steps.length}: {steps.find(s => s.id === currentStep)?.title}
          </div>
        </div>
        
        {/* Step Labels */}
        <div className="flex justify-between mt-2 text-sm">
          {steps.map((step) => (
            <span
              key={step.id}
              className={cn(
                "transition-colors duration-300",
                step.id < currentStep
                  ? "text-accent font-medium" // Completed
                  : step.id === currentStep
                  ? "text-primary font-medium" // Active
                  : "text-muted-foreground" // Pending
              )}
              data-testid={`step-label-${step.id}`}
            >
              {step.title}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
