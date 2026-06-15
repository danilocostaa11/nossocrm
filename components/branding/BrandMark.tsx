import Image from 'next/image';
import { cn } from '@/lib/utils/cn';

export const YUMIA_LOGO_SRC = '/branding/yumia-logo.png';

export interface BrandMarkProps {
  /**
   * full — logo completo, escala proporcional (sidebar expandida, login)
   * icon — só o símbolo (sidebar recolhida, rail tablet)
   * icon-with-label — símbolo + texto "YumIA" (legado / login alternativo)
   */
  variant?: 'full' | 'icon' | 'icon-with-label';
  /** @deprecated Use variant="icon-with-label" | variant="icon" */
  showLabel?: boolean;
  /** sm = rail tablet; md = sidebar; lg = login */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  labelClassName?: string;
}

const iconBox: Record<NonNullable<BrandMarkProps['size']>, string> = {
  sm: 'h-10 w-10 rounded-xl',
  md: 'h-9 w-9 rounded-xl',
  lg: 'h-14 w-14 rounded-2xl',
};

const fullHeight: Record<NonNullable<BrandMarkProps['size']>, string> = {
  sm: 'h-10',
  md: 'h-10',
  lg: 'h-16',
};

/** Escala o logo para preencher o quadrado com apenas o símbolo superior (~50% do PNG). */
const iconImageScale: Record<NonNullable<BrandMarkProps['size']>, string> = {
  sm: 'w-[195%]',
  md: 'w-[195%]',
  lg: 'w-[195%]',
};

function BrandIcon({
  size,
  priority,
}: {
  size: NonNullable<BrandMarkProps['size']>;
  priority?: boolean;
}) {
  return (
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
        sizes={size === 'lg' ? '56px' : size === 'sm' ? '40px' : '36px'}
        className={cn(
          'absolute left-1/2 top-0 max-w-none -translate-x-1/2 h-auto pointer-events-none select-none',
          iconImageScale[size]
        )}
        priority={priority}
        aria-hidden
      />
    </div>
  );
}

function BrandFull({
  size,
  priority,
  className,
}: {
  size: NonNullable<BrandMarkProps['size']>;
  priority?: boolean;
  className?: string;
}) {
  return (
    <Image
      src={YUMIA_LOGO_SRC}
      alt="YumIA"
      width={500}
      height={500}
      sizes={size === 'lg' ? '256px' : '160px'}
      className={cn(
        'w-auto max-w-full object-contain object-left',
        fullHeight[size],
        className
      )}
      priority={priority}
    />
  );
}

/**
 * Marca YumIA — logo oficial responsivo (completo ou ícone recortado).
 */
export function BrandMark({
  variant,
  showLabel,
  size = 'md',
  className,
  labelClassName,
}: BrandMarkProps) {
  const resolvedVariant =
    variant ?? (showLabel === false ? 'icon' : showLabel ? 'icon-with-label' : 'full');

  if (resolvedVariant === 'full') {
    return (
      <div className={cn('flex min-w-0 max-w-full items-center', className)}>
        <BrandFull size={size} priority={size === 'lg'} />
      </div>
    );
  }

  if (resolvedVariant === 'icon') {
    return (
      <div className={cn('flex shrink-0 items-center justify-center', className)}>
        <BrandIcon size={size} priority={size === 'lg'} />
      </div>
    );
  }

  return (
    <div className={cn('flex min-w-0 items-center gap-3', className)}>
      <BrandIcon size={size} priority={size === 'lg'} />
      <span
        className={cn(
          'truncate text-xl font-bold tracking-wide text-[#d4af37] font-serif',
          labelClassName
        )}
      >
        YumIA
      </span>
    </div>
  );
}
