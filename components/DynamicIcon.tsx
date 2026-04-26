import { getIcon } from '@/lib/icon';
import { Grid2X2, LucideProps } from 'lucide-react';
import { createElement, ReactNode } from 'react';

interface DynamicIconProps extends LucideProps {
  name: string;
  fallback?: ReactNode;
}

const DynamicIcon = ({ name, fallback, ...restProps }: DynamicIconProps) => {
  const Icon = getIcon(name);

  return Icon ? (
    createElement(Icon, restProps)
  ) : fallback ? (
    <>{fallback}</>
  ) : (
    <Grid2X2 {...restProps} />
  );
};

export default DynamicIcon;
