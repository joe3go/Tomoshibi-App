
import React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

// Container Variants
const containerVariants = cva(
  'mx-auto w-full',
  {
    variants: {
      size: {
        xs: 'max-w-xs',
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '3xl': 'max-w-3xl',
        '4xl': 'max-w-4xl',
        '5xl': 'max-w-5xl',
        '6xl': 'max-w-6xl',
        '7xl': 'max-w-7xl',
        full: 'max-w-full',
        screen: 'max-w-screen-2xl',
      },
      padding: {
        none: 'px-0',
        sm: 'px-4',
        md: 'px-6',
        lg: 'px-8',
        xl: 'px-12',
      },
    },
    defaultVariants: {
      size: '7xl',
      padding: 'md',
    },
  }
);

// Stack Variants
const stackVariants = cva(
  'flex',
  {
    variants: {
      direction: {
        row: 'flex-row',
        column: 'flex-col',
        'row-reverse': 'flex-row-reverse',
        'column-reverse': 'flex-col-reverse',
      },
      align: {
        start: 'items-start',
        center: 'items-center',
        end: 'items-end',
        stretch: 'items-stretch',
        baseline: 'items-baseline',
      },
      justify: {
        start: 'justify-start',
        center: 'justify-center',
        end: 'justify-end',
        between: 'justify-between',
        around: 'justify-around',
        evenly: 'justify-evenly',
      },
      gap: {
        none: 'gap-0',
        xs: 'gap-1',
        sm: 'gap-2',
        md: 'gap-4',
        lg: 'gap-6',
        xl: 'gap-8',
        '2xl': 'gap-12',
      },
      wrap: {
        true: 'flex-wrap',
        false: 'flex-nowrap',
        reverse: 'flex-wrap-reverse',
      },
    },
    defaultVariants: {
      direction: 'column',
      align: 'stretch',
      justify: 'start',
      gap: 'md',
      wrap: false,
    },
  }
);

// Container Component
interface ContainerProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {}

export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size, padding, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(containerVariants({ size, padding }), className)}
        {...props}
      />
    );
  }
);

Container.displayName = 'Container';

// Stack Component
interface StackProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof stackVariants> {}

export const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ className, direction, align, justify, gap, wrap, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(stackVariants({ direction, align, justify, gap, wrap }), className)}
        {...props}
      />
    );
  }
);

Stack.displayName = 'Stack';

// Grid Component
interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  responsive?: boolean;
}

export const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({ className, cols = 1, gap = 'md', responsive = true, ...props }, ref) => {
    const gridCols = {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
      6: 'grid-cols-6',
      7: 'grid-cols-7',
      8: 'grid-cols-8',
      9: 'grid-cols-9',
      10: 'grid-cols-10',
      11: 'grid-cols-11',
      12: 'grid-cols-12',
    };

    const gapClasses = {
      none: 'gap-0',
      xs: 'gap-1',
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8',
      '2xl': 'gap-12',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'grid',
          responsive ? `grid-cols-1 md:${gridCols[cols]}` : gridCols[cols],
          gapClasses[gap],
          className
        )}
        {...props}
      />
    );
  }
);

Grid.displayName = 'Grid';

// Section Component
interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'section' | 'article' | 'aside' | 'nav' | 'header' | 'footer' | 'main' | 'div';
  variant?: 'default' | 'padded' | 'glass' | 'content-card';
}

export const Section = React.forwardRef<HTMLElement, SectionProps>(
  ({ className, as = 'section', variant = 'default', ...props }, ref) => {
    const Component = as as keyof JSX.IntrinsicElements;
    
    const variantClasses = {
      default: '',
      padded: 'py-16 lg:py-24',
      glass: 'glass-card',
      'content-card': 'content-card',
    };

    return (
      <Component
        ref={ref}
        className={cn(variantClasses[variant], className)}
        {...props}
      />
    );
  }
);

Section.displayName = 'Section';

// Spacer Component
interface SpacerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  axis?: 'horizontal' | 'vertical' | 'both';
}

export const Spacer: React.FC<SpacerProps> = ({ 
  size = 'md', 
  axis = 'vertical' 
}) => {
  const sizeClasses = {
    xs: '4',
    sm: '6',
    md: '8',
    lg: '12',
    xl: '16',
    '2xl': '24',
    '3xl': '32',
  };

  const axisClasses = {
    horizontal: `w-${sizeClasses[size]}`,
    vertical: `h-${sizeClasses[size]}`,
    both: `w-${sizeClasses[size]} h-${sizeClasses[size]}`,
  };

  return <div className={axisClasses[axis]} aria-hidden="true" />;
};

Spacer.displayName = 'Spacer';
