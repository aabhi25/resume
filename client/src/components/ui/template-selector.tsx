import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Template {
  id: string;
  name: string;
  description: string;
  preview: string;
}

interface TemplateSelectorProps {
  selectedTemplate: string;
  onTemplateSelect: (templateId: string) => void;
  className?: string;
}

const templates: Template[] = [
  {
    id: "modern",
    name: "Modern",
    description: "Clean and contemporary design with accent colors",
    preview: "modern-preview",
  },
  {
    id: "classic",
    name: "Classic",
    description: "Traditional professional format with serif fonts",
    preview: "classic-preview",
  },
  {
    id: "creative",
    name: "Creative",
    description: "Eye-catching design with gradient backgrounds",
    preview: "creative-preview",
  },
  {
    id: "executive",
    name: "Executive",
    description: "Sophisticated layout for senior positions",
    preview: "executive-preview",
  },
];

export function TemplateSelector({
  selectedTemplate,
  onTemplateSelect,
  className,
}: TemplateSelectorProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-3", className)} data-testid="template-selector">
      {templates.map((template) => (
        <div
          key={template.id}
          className={cn(
            "border-2 rounded-lg p-3 cursor-pointer transition-all duration-200 hover:shadow-md",
            selectedTemplate === template.id
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          )}
          onClick={() => onTemplateSelect(template.id)}
          data-testid={`template-${template.id}`}
        >
          <div className="aspect-[3/4] bg-card rounded border border-border mb-2 relative overflow-hidden">
            {/* Template Preview */}
            <div className="p-2 text-xs">
              <div 
                className={cn(
                  "h-2 rounded mb-1",
                  template.id === "modern" && "bg-primary",
                  template.id === "classic" && "bg-foreground",
                  template.id === "creative" && "bg-gradient-to-r from-primary to-accent",
                  template.id === "executive" && "bg-foreground"
                )}
              ></div>
              <div className="h-1 bg-muted rounded mb-2"></div>
              <div className="space-y-1">
                <div className="h-1 bg-muted rounded"></div>
                <div className="h-1 bg-muted rounded w-3/4"></div>
                <div className="h-1 bg-muted rounded w-1/2"></div>
              </div>
            </div>
            
            {/* Selected Indicator */}
            {selectedTemplate === template.id && (
              <div className="absolute top-2 right-2">
                <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              </div>
            )}
          </div>
          
          <div className="text-center">
            <p className={cn(
              "text-xs font-medium",
              selectedTemplate === template.id ? "text-primary" : "text-foreground"
            )}>
              {template.name}
            </p>
            <p className="text-xs text-muted-foreground mt-1 leading-tight">
              {template.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
