
import { Card } from '@/components/ui/card';

interface Step {
  id: string;
  title: string;
  subtitle: string;
}

interface ProgressStepsProps {
  steps: Step[];
  currentStepIndex: number;
}

export const ProgressSteps = ({ steps, currentStepIndex }: ProgressStepsProps) => {
  return (
    <Card className="p-4 sm:p-6 mb-6 sm:mb-8 backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border-0 shadow-xl">
      {/* Mobile: Compact progress indicator */}
      <div className="block sm:hidden">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-muted-foreground">
            Langkah {currentStepIndex + 1} dari {steps.length}
          </span>
          <span className="text-sm font-semibold text-primary">
            {steps[currentStepIndex].title}
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Desktop: Full progress steps */}
      <div className="hidden sm:flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                  index <= currentStepIndex
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-110'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {index + 1}
              </div>
              <div className="mt-2 text-center">
                <span
                  className={`text-sm font-medium transition-colors ${
                    index <= currentStepIndex ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {step.subtitle}
                </span>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-20 h-1 mx-4 rounded-full transition-all duration-500 ${
                  index < currentStepIndex 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600' 
                    : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};
