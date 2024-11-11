import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface AlertCardProps {
  title: string;
  description: string;
  variant?: "default" | "destructive" | "success" | "warning";
  action?: {
    label: string;
    onClick: () => void;
  };
}

const icons = {
  default: Info,
  destructive: AlertCircle,
  success: CheckCircle2,
  warning: AlertTriangle,
};

export function AlertCard({ title, description, variant = "default", action }: AlertCardProps) {
  const Icon = icons[variant];

  return (
    <Card>
      <CardContent className="pt-6">
        <Alert variant={variant}>
          <Icon className="h-4 w-4" />
          <AlertTitle>{title}</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>{description}</span>
            {action && (
              <Button variant="outline" onClick={action.onClick} className="mt-2">
                {action.label}
              </Button>
            )}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
