export default function Badge({ children, variant = 'primary', className = '' }) {
    const variants = {
        primary: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
        secondary: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
        danger: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
        warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    };

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${variants[variant]} ${className}`}>
            {children}
        </span>
    );
}
