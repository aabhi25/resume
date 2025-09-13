import { cn } from "@/lib/utils";
import { Progress } from "./progress";
import { Check, Clock, Loader2 } from "lucide-react";

interface LoadingModalProps {
  isOpen: boolean;
  title?: string;
  description?: string;
  progress?: number;
  steps?: Array<{
    label: string;
    status: 'completed' | 'active' | 'pending';
  }>;
  className?: string;
}

export function LoadingModal({
  isOpen,
  title = "Processing...",
  description = "Please wait while we process your request",
  progress = 0,
  steps = [],
  className,
}: LoadingModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      data-testid="loading-modal"
    >
      <div className={cn("bg-card rounded-lg border border-border p-8 max-w-md mx-4 w-full", className)}>
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
          
          <h3 className="text-lg font-semibold text-foreground mb-2" data-testid="modal-title">
            {title}
          </h3>
          
          <p className="text-sm text-muted-foreground mb-6" data-testid="modal-description">
            {description}
          </p>
          
          {/* Progress Bar */}
          {progress > 0 && (
            <div className="mb-6">
              <Progress value={progress} className="h-2" data-testid="modal-progress" />
            </div>
          )}
          
          {/* Steps */}
          {steps.length > 0 && (
            <div className="space-y-3" data-testid="modal-steps">
              {steps.map((step, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-center space-x-2 text-sm"
                  data-testid={`step-${index}`}
                >
                  {step.status === 'completed' && (
                    <Check className="h-4 w-4 text-accent" />
                  )}
                  {step.status === 'active' && (
                    <Loader2 className="h-4 w-4 text-primary animate-spin" />
                  )}
                  {step.status === 'pending' && (
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span 
                    className={cn(
                      step.status === 'completed' && "text-accent",
                      step.status === 'active' && "text-primary",
                      step.status === 'pending' && "text-muted-foreground opacity-50"
                    )}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
