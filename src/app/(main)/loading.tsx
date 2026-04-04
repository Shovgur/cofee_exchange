export default function Loading() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-50 bg-bg/80 backdrop-blur-sm">
      {/* Кольца */}
      <div className="relative flex items-center justify-center mb-8">
        {/* Внешнее медленное кольцо */}
        <span
          className="absolute rounded-full border border-orange/20"
          style={{
            width: 88,
            height: 88,
            animation: 'loader-ring-outer 2.4s ease-in-out infinite',
          }}
        />
        {/* Среднее кольцо */}
        <span
          className="absolute rounded-full border border-orange/40"
          style={{
            width: 64,
            height: 64,
            animation: 'loader-ring-mid 2.4s ease-in-out infinite 0.2s',
          }}
        />
        {/* Спиннер */}
        <span
          className="w-10 h-10 rounded-full border-2 border-white/5 border-t-orange animate-spin"
          style={{ animationDuration: '0.75s' }}
        />
        {/* Эмодзи в центре */}
        <span
          className="absolute text-lg"
          style={{ animation: 'loader-icon-pulse 2s ease-in-out infinite' }}
        >
          ☕
        </span>
      </div>

      {/* Точки */}
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-orange/60"
            style={{
              animation: `loader-dot 1.2s ease-in-out infinite`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes loader-ring-outer {
          0%, 100% { transform: scale(1);    opacity: 0.3; }
          50%       { transform: scale(1.15); opacity: 0.7; }
        }
        @keyframes loader-ring-mid {
          0%, 100% { transform: scale(1);    opacity: 0.5; }
          50%       { transform: scale(1.1);  opacity: 0.9; }
        }
        @keyframes loader-icon-pulse {
          0%, 100% { opacity: 0.6; transform: scale(0.9); }
          50%       { opacity: 1;   transform: scale(1.1); }
        }
        @keyframes loader-dot {
          0%, 80%, 100% { transform: scaleY(0.6); opacity: 0.4; }
          40%            { transform: scaleY(1.4); opacity: 1;   }
        }
      `}</style>
    </div>
  );
}
