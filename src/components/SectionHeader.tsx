interface Props {
  code: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}
export function SectionHeader({ code, title, subtitle, right }: Props) {
  return (
    <div className="flex flex-col gap-4 mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-[9px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-bold tracking-widest uppercase">
            {code}
          </div>
          {subtitle && (
            <span className="text-[10px] text-white/60 uppercase tracking-widest">
              • {subtitle}
            </span>
          )}
        </div>
        {right && <div className="animate-in fade-in slide-in-from-right-4 duration-500">{right}</div>}
      </div>
      
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent uppercase">
          {title}
        </h1>
      </div>
    </div>
  );
}
