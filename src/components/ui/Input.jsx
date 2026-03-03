import { forwardRef } from 'react';

const Input = forwardRef(
  (
    {
      label,
      error,
      type = 'text',
      className = '',
      ...props
    },
    ref
  ) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          className={`
            w-full px-4 py-3.5 rounded-2xl
            border border-gray-200
            bg-gray-50 text-gray-900
            placeholder:text-gray-400
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white
            transition-all duration-200
            text-base
            ${error ? 'border-red-500 focus:ring-red-500 bg-red-50' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
