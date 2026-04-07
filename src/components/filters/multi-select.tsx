import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder,
}: {
  options: Option[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function toggle(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-11 min-w-[170px] items-center justify-between gap-2 rounded-2xl border border-white/8 bg-white/4 px-4 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
          "hover:border-white/14 hover:bg-white/7 hover:text-white",
          "focus:ring-ring focus:ring-2 focus:outline-none",
        )}
      >
        {selected.length === 0 ? (
          <span className="text-muted-foreground">{placeholder}</span>
        ) : (
          <div className="flex items-center gap-1 overflow-hidden">
            <Badge variant="secondary" className="border border-white/6 bg-white/8 text-xs text-white">
              {selected.length} selected
            </Badge>
          </div>
        )}
        <ChevronDown className="h-4 w-4 shrink-0 text-[#8fa0cf]" />
      </button>

      {open && (
        <div className="absolute top-full z-50 mt-2 max-h-60 w-full min-w-[220px] overflow-auto rounded-2xl border border-white/10 bg-[#111726] p-2 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-[#9ea9c4] hover:bg-white/6"
            >
              <X className="h-3.5 w-3.5" />
              Clear all
            </button>
          )}
          {options.map((option) => {
            const isSelected = selected.includes(option.value);
            return (
              <button
                type="button"
                key={option.value}
                onClick={() => toggle(option.value)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-white/6",
                  isSelected && "font-medium text-white",
                )}
              >
                <div
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-white/15",
                  )}
                >
                  {isSelected && <Check className="h-3 w-3" />}
                </div>
                <span className={isSelected ? "text-white" : "text-[#cad2ea]"}>
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
