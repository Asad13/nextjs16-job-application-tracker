import * as LucideIcons from 'lucide-react';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';
import type { LucideProps } from 'lucide-react';

export type LucideIconName = keyof typeof LucideIcons;

export type LucideIconComponent = ForwardRefExoticComponent<
  LucideProps & RefAttributes<SVGSVGElement>
>;

export function getIcon(name: string): LucideIconComponent | null {
  const icon = LucideIcons[name as LucideIconName];

  if (icon) {
    return icon as LucideIconComponent;
  }

  return null;
}
