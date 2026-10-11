export default function RootLoading() {
  return (
    <div className="min-h-screen grid-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div
            className="absolute inset-0 rounded-full border-2 border-t-[#F5A623] border-r-transparent
                       border-b-transparent border-l-transparent animate-spin"
          />
          <div
            className="absolute inset-2 rounded-full border border-t-transparent
                       border-r-[#4FC3F7] border-b-transparent border-l-transparent animate-spin"
            style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}
          />
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ color: '#F5A623', opacity: 0.8 }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <circle cx="6" cy="6" r="2.5" />
            </svg>
          </div>
        </div>
        <p className="text-text-muted text-[11px] font-display uppercase tracking-widest animate-pulse">
          Loading
        </p>
      </div>
    </div>
  );
}
