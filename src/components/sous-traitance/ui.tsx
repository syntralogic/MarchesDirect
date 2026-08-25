import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Check, ArrowLeft } from 'lucide-react';

export function TopBar({ backHref, title }: { backHref: string; title?: string }) {
  return (
    <div className="flex items-center gap-3 px-4 pt-4 pb-2 max-w-2xl mx-auto">
      <Link to={backHref} className="w-8 h-8 rounded-lg border border-[#17334D] flex items-center justify-center text-[#B9BBC8] hover:text-white hover:border-orange/40 transition-colors shrink-0">
        <ArrowLeft size={15} />
      </Link>
      {title && <span className="text-xs font-semibold text-white truncate">{title}</span>}
    </div>
  );
}


export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="text-[10px] font-bold text-orange uppercase tracking-widest mb-1 block">
      {children}
    </span>
  );
}

export function PageTitle({ children }: { children: ReactNode }) {
  return (
    <h1 className="text-lg md:text-2xl font-extrabold text-white mb-1.5 leading-snug">
      {children}
    </h1>
  );
}

export function PageSub({ children }: { children: ReactNode }) {
  return (
    <p className="text-[#B9BBC8] text-xs md:text-sm leading-snug mb-4">
      {children}
    </p>
  );
}

const BADGE_TONES: Record<string, string> = {
  orange: 'bg-orange/15 text-orange border-orange/30',
  green: 'bg-[#3FA96E]/15 text-[#3FA96E] border-[#3FA96E]/30',
};

export function Badge({ children, tone = 'orange', className = '' }: { children: ReactNode; tone?: 'orange' | 'green'; className?: string }) {
  return (
    <span className={`inline-block text-[9px] font-bold uppercase tracking-wide border rounded px-2 py-1 ${BADGE_TONES[tone]} ${className}`}>
      {children}
    </span>
  );
}

interface ButtonProps {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'solid' | 'outline';
}

export function Button({ children, href, onClick, type = 'button', variant = 'solid' }: ButtonProps) {
  const cls = variant === 'solid'
    ? 'w-full bg-orange text-white font-semibold text-sm py-3 rounded-xl text-center block hover:brightness-110 transition-all'
    : 'w-full border border-[#17334D] text-[#B9BBC8] font-semibold text-sm py-3 rounded-xl text-center block hover:border-orange/40 hover:text-white transition-colors';

  if (href) {
    return <Link to={href} className={`${cls} mb-2.5`}>{children}</Link>;
  }
  return (
    <button type={type} onClick={onClick} className={`${cls} mb-2.5`}>
      {children}
    </button>
  );
}

export function InfoBox({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-[#17334D] bg-[#031B30] p-3 text-xs text-[#B9BBC8]">
      {children}
    </div>
  );
}

export function KeyValueRow({ label, value, positive = false }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#17334D] last:border-b-0">
      <span className="text-xs text-[#B9BBC8]">{label}</span>
      <span className={`text-xs font-semibold ${positive ? 'text-[#3FA96E]' : 'text-white'}`}>{value}</span>
    </div>
  );
}

interface Step { label: string }

export function StepIndicator({ steps, current }: { steps: Step[]; current: number }) {
  return (
    <div className="flex items-center gap-1 px-4 mb-5 overflow-x-auto">
      {steps.map((step, i) => {
        const stepNum = i + 1;
        const done = stepNum < current;
        const active = stepNum === current;
        return (
          <div key={step.label} className="flex items-center gap-1 shrink-0">
            <div className={`flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-bold shrink-0 ${
              done ? 'bg-[#3FA96E] text-white' : active ? 'bg-orange text-white' : 'bg-[#061D32] border border-[#17334D] text-[#B9BBC8]'
            }`}>
              {done ? <Check size={11} /> : stepNum}
            </div>
            <span className={`text-[9px] font-medium whitespace-nowrap ${active ? 'text-white' : 'text-[#B9BBC8]'}`}>
              {step.label}
            </span>
            {stepNum < steps.length && <div className="w-4 h-px bg-[#17334D] mx-1" />}
          </div>
        );
      })}
    </div>
  );
}

export interface TimelineItem {
  title: string;
  sub?: string;
  status: 'done' | 'active' | 'wait';
}

export function RelationTimeline({ items }: { items: TimelineItem[] }) {
  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              item.status === 'done' ? 'bg-[#3FA96E]' : item.status === 'active' ? 'bg-orange' : 'bg-[#17334D]'
            }`} />
            {i < items.length - 1 && <div className="w-px flex-1 bg-[#17334D] my-1" />}
          </div>
          <div className="pb-1">
            <p className={`text-xs font-semibold ${item.status === 'wait' ? 'text-[#B9BBC8]' : 'text-white'}`}>{item.title}</p>
            {item.sub && <p className="text-[10px] text-[#B9BBC8] mt-0.5">{item.sub}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
