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
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 px-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          className={`
            w-full px-5 py-4 rounded-2xl
            border border-slate-200 dark:border-slate-800/60
            bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100
            placeholder:text-slate-400 dark:placeholder:text-slate-500
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent 
            dark:focus:bg-slate-800
            transition-all duration-300
            text-base shadow-sm
            ${error ? 'border-rose-500 focus:ring-rose-500 bg-rose-50 dark:bg-rose-900/20' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
