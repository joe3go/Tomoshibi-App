
import React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

// Typography Variants
const headingVariants = cva(
  'font-medium tracking-tight',
  {
    variants: {
      size: {
        h1: 'text-4xl lg:text-5xl font-bold',
        h2: 'text-3xl lg:text-4xl font-semibold',
        h3: 'text-2xl lg:text-3xl font-semibold',
        h4: 'text-xl lg:text-2xl font-medium',
        h5: 'text-lg lg:text-xl font-medium',
        h6: 'text-base lg:text-lg font-medium',
      },
      color: {
        primary: 'text-primary',
        secondary: 'text-secondary-foreground',
        muted: 'text-muted-foreground',
        destructive: 'text-destructive',
        accent: 'text-accent-foreground',
      },
    },
    defaultVariants: {
      size: 'h1',
      color: 'primary',
    },
  }
);

const textVariants = cva(
  'leading-relaxed',
  {
    variants: {
      size: {
        xs: 'text-xs',
        sm: 'text-sm',
        base: 'text-base',
        lg: 'text-lg',
        xl: 'text-xl',
      },
      weight: {
        normal: 'font-normal',
        medium: 'font-medium',
        semibold: 'font-semibold',
        bold: 'font-bold',
      },
      color: {
        primary: 'text-foreground',
        secondary: 'text-secondary-foreground',
        muted: 'text-muted-foreground',
        destructive: 'text-destructive',
        accent: 'text-accent-foreground',
      },
    },
    defaultVariants: {
      size: 'base',
      weight: 'normal',
      color: 'primary',
    },
  }
);

// Heading Component
interface HeadingProps 
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, size, color, as, ...props }, ref) => {
    const Component = as || (size as keyof JSX.IntrinsicElements) || 'h1';
    
    return (
      <Component
        ref={ref}
        className={cn(headingVariants({ size, color }), className)}
        {...props}
      />
    );
  }
);

Heading.displayName = 'Heading';

// Text Component
interface TextProps 
  extends React.HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof textVariants> {
  as?: 'p' | 'span' | 'div' | 'label';
}

export const Text = React.forwardRef<HTMLParagraphElement, TextProps>(
  ({ className, size, weight, color, as = 'p', ...props }, ref) => {
    const Component = as as keyof JSX.IntrinsicElements;
    
    return (
      <Component
        ref={ref}
        className={cn(textVariants({ size, weight, color }), className)}
        {...props}
      />
    );
  }
);

Text.displayName = 'Text';

// Japanese Text Component with Font Optimization
interface JapaneseTextProps extends TextProps {
  enableFurigana?: boolean;
  verticalWriting?: boolean;
}

export const JapaneseText = React.forwardRef<HTMLParagraphElement, JapaneseTextProps>(
  ({ className, enableFurigana = false, verticalWriting = false, ...props }, ref) => {
    return (
      <Text
        ref={ref}
        className={cn(
          'font-japanese',
          enableFurigana && 'ruby-container',
          verticalWriting && 'writing-vertical',
          className
        )}
        {...props}
      />
    );
  }
);

JapaneseText.displayName = 'JapaneseText';

// Code Component
interface CodeProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'inline' | 'block';
}

export const Code = React.forwardRef<HTMLElement, CodeProps>(
  ({ className, variant = 'inline', children, ...props }, ref) => {
    if (variant === 'block') {
      return (
        <pre
          ref={ref}
          className={cn(
            'rounded-lg bg-muted p-4 overflow-x-auto text-sm font-mono',
            className
          )}
          {...props}
        >
          <code>{children}</code>
        </pre>
      );
    }

    return (
      <code
        ref={ref}
        className={cn(
          'px-2 py-1 rounded bg-muted text-sm font-mono',
          className
        )}
        {...props}
      >
        {children}
      </code>
    );
  }
);

Code.displayName = 'Code';
