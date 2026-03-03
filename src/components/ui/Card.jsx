export default function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

Card.Header = function CardHeader({ children, className = '' }) {
  return (
    <div className={`px-4 py-3 border-b border-gray-100 ${className}`}>
      {children}
    </div>
  );
};

Card.Body = function CardBody({ children, className = '' }) {
  return <div className={`p-4 ${className}`}>{children}</div>;
};

Card.Footer = function CardFooter({ children, className = '' }) {
  return (
    <div className={`px-4 py-3 border-t border-gray-100 ${className}`}>
      {children}
    </div>
  );
};
