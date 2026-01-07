import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
  showText?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ current, total, showText = true }) => {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  const filledDots = Math.round((current / total) * 8);

  return (
    <div className="flex items-center space-x-2">
      {showText && (
        <span className="text-sm text-gray-600">
          {current}/{total}
        </span>
      )}
      <div className="flex space-x-0.5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full ${
              i < filledDots ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
      {showText && (
        <span className="text-sm font-medium text-gray-900">{percentage}%</span>
      )}
    </div>
  );
};

export default ProgressBar;
