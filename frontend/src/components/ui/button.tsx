import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default:
          'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 focus:ring-primary-500',
        destructive:
          'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 focus:ring-red-500',
        outline:
          'border border-zinc-700 bg-transparent text-zinc-100 hover:bg-zinc-800 hover:border-zinc-600 focus:ring-zinc-500',
        secondary:
          'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 active:bg-zinc-600 focus:ring-zinc-500',
        ghost:
          'bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 focus:ring-zinc-500',
        link:
          'bg-transparent text-primary-400 hover:text-primary-300 hover:underline focus:ring-primary-500',
        success:
          'bg-green-500 text-white hover:bg-green-600 active:bg-green-700 focus:ring-green-500',
        warning:
          'bg-yellow-500 text-black hover:bg-yellow-400 active:bg-yellow-500 focus:ring-yellow-500',
      },
      size: {
        xs: 'h-7 px-2 text-xs rounded-md',
        sm: 'h-9 px-3 text-sm rounded-md',
        default: 'h-11 px-6 text-base rounded-lg',
        lg: 'h-14 px-8 text-lg rounded-lg',
        xl: 'h-16 px-10 text-xl rounded-xl',
        icon: 'h-10 w-10 rounded-lg',
        'icon-sm': 'h-8 w-8 rounded-md',
        'icon-lg': 'h-12 w-12 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      isLoading,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {children}
          </>
        ) : (
          <>
            {leftIcon}
            {children}
            {rightIcon}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
