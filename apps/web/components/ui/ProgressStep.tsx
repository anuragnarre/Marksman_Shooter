// apps/web/components/ui/ProgressStep.tsx
'use client';

// DESIGN NOTE: Sequential step indicator used in the photo analysis flow.
// Active step bar fills from left to right with CSS animation. Each step
// can hold a status: pending (grey), active (filling amber), done (solid amber).

interface Step {
  label: string;
  status: 'pending' | 'active' | 'done';
}

interface ProgressStepProps {
  steps: Step[];
}

export function ProgressStep({ steps }: ProgressStepProps) {
  return (
    <div className="w-full space-y-2" role="progressbar" aria-label="Analysis progress">
      {steps.map((step, i) => (
        <div key={i} className="space-y-1">
          {/* Label row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Step indicator dot */}
              <span
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-display font-bold shrink-0 transition-all duration-300 ${
                  step.status === 'done'
                    ? 'bg-accent text-[#080A0F]'
                    : step.status === 'active'
                    ? 'bg-accent/20 border border-accent text-accent animate-pulse-glow'
                    : 'bg-subtle border border-[#2A3040] text-text-muted'
                }`}
              >
                {step.status === 'done' ? '✓' : i + 1}
              </span>

              <span
                className={`text-xs font-display font-semibold uppercase tracking-wide transition-colors duration-300 ${
                  step.status === 'done'
                    ? 'text-[#00E5A0]'
                    : step.status === 'active'
                    ? 'text-accent'
                    : 'text-text-muted'
                }`}
              >
                {step.label}
              </span>
            </div>

            {step.status === 'done' && (
              <span className="text-[10px] text-[#00E5A0] font-display font-bold uppercase tracking-widest">
                Done
              </span>
            )}
            {step.status === 'active' && (
              <span className="text-[10px] text-accent font-data animate-pulse">
                ...
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="h-0.5 rounded-full bg-subtle overflow-hidden">
            {step.status === 'done' && (
              <div className="h-full rounded-full bg-accent w-full transition-all duration-500" />
            )}
            {step.status === 'active' && (
              <div
                className="h-full rounded-full bg-accent"
                style={{
                  width: '100%',
                  animation: 'progressFill 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                  boxShadow: '0 0 8px rgba(245, 166, 35, 0.6)',
                }}
              />
            )}
            {step.status === 'pending' && (
              <div className="h-full rounded-full bg-transparent w-0" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
