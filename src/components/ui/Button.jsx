import { forwardRef } from 'react';

const variants = {
  primary: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-lg shadow-blue-600/25',
  secondary: 'bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-800',
  success: 'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white shadow-lg shadow-green-600/25',
  danger: 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-lg shadow-red-600/25',
  ghost: 'bg-transparent hover:bg-gray-100 active:bg-gray-200 text-gray-700',
  outline: 'border-2 border-gray-200 text-gray-700 hover:bg-gray-50 active:bg-gray-100',
};

const sizes = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-5 py-3 text-base',
  lg: 'px-6 py-4 text-lg',
  icon: 'p-3',
};

const Button = forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      disabled = false,
      loading = false,
      className = '',
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-center
          font-semibold rounded-2xl
          transition-all duration-200
          focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
          active:scale-[0.98]
          ${variants[variant]}
          ${sizes[size]}
          ${className}
        `}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
