import Image from 'next/image';
import { cn } from '@/lib/utils/cn';

export const YUMIA_LOGO_SRC = '/branding/yumia-logo.png';

export interface BrandMarkProps {
  /** Exibe o nome "YumIA" ao lado do ícone */
  showLabel?: boolean;
  /** sm = rail tablet (40px); md = sidebar (36px); lg = login (56px) */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  labelClassName?: string;
}

const iconBox: Record<NonNullable<BrandMarkProps['size']>, string> = {
  sm: 'h-10 w-10 rounded-xl',
  md: 'h-9 w-9 rounded-xl',
  lg: 'h-14 w-14 rounded-2xl',
};

/**
 * Marca YumIA — ícone recortado do logo oficial + tipografia dourada.
 */
export function BrandMark({
  showLabel = true,
  size = 'md',
  className,
  labelClassName,
}: BrandMarkProps) {
  return (
    <div className={cn('flex items-center gap-3 min-w-0', className)}>
      <div
        className={cn(
          'relative shrink-0 overflow-hidden bg-[#0a0a0b] ring-1 ring-[#d4af37]/20 shadow-lg shadow-black/40',
          iconBox[size]
        )}
      >
        <Image
          src={YUMIA_LOGO_SRC}
          alt=""
          width={1000}
          height={1000}
          className="absolute left-0 top-0 h-[265%] w-full object-cover object-top"
          priority={size === 'lg'}
          aria-hidden
        />
      </div>
      {showLabel ? (
        <span
          className={cn(
            'text-xl font-bold tracking-wide text-[#d4af37] whitespace-nowrap overflow-hidden font-serif',
            labelClassName
          )}
        >
          YumIA
        </span>
      ) : null}
    </div>
  );
}
