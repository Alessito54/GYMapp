export default function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-white dark:bg-slate-900/40 rounded-3xl shadow-sm border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-sm transition-all duration-300 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

Card.Header = function CardHeader({ children, className = '' }) {
  return (
    <div className={`px-5 py-4 border-b border-slate-100 dark:border-slate-700/50 ${className}`}>
      {children}
    </div>
  );
};

Card.Body = function CardBody({ children, className = '' }) {
  return <div className={`p-5 ${className}`}>{children}</div>;
};

Card.Footer = function CardFooter({ children, className = '' }) {
  return (
    <div className={`px-5 py-4 border-t border-slate-100 dark:border-slate-700/50 ${className}`}>
      {children}
    </div>
  );
};
