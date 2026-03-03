export default function ProgressBar({ 
  progress, 
  color = 'bg-blue-600',
  bgColor = 'bg-gray-200',
  height = 'h-2',
  showLabel = false,
  className = '' 
}) {
  const percentage = Math.min(Math.round(progress * 100), 100);

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Progreso</span>
          <span className="font-medium">{percentage}%</span>
        </div>
      )}
      <div className={`w-full ${bgColor} rounded-full ${height} overflow-hidden`}>
        <div
          className={`${color} ${height} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
