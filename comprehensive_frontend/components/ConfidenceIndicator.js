/**
 * Confidence Indicator Component
 * Color-coded confidence score visualization (Green/Yellow/Red)
 */

import React from 'react';

const ConfidenceIndicator = ({ confidence, level, showLabel = true, size = 'md' }) => {
  // Determine color based on confidence score
  const getColor = () => {
    if (confidence >= 0.75) return 'green';
    if (confidence >= 0.60) return 'yellow';
    return 'red';
  };

  const color = getColor();
  const percentage = Math.round(confidence * 100);

  // Size variants
  const sizeClasses = {
    sm: 'h-2 text-xs',
    md: 'h-3 text-sm',
    lg: 'h-4 text-base'
  };

  // Color classes
  const colorClasses = {
    green: {
      bg: 'bg-green-500',
      text: 'text-green-600',
      border: 'border-green-500',
      glow: 'shadow-green-500/50'
    },
    yellow: {
      bg: 'bg-yellow-500',
      text: 'text-yellow-600',
      border: 'border-yellow-500',
      glow: 'shadow-yellow-500/50'
    },
    red: {
      bg: 'bg-red-500',
      text: 'text-red-600',
      border: 'border-red-500',
      glow: 'shadow-red-500/50'
    }
  };

  const colors = colorClasses[color];

  return (
    <div className="confidence-indicator">
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-400">Confidence</span>
          <span className={`text-xs font-bold ${colors.text}`}>
            {percentage}% {level && `(${level})`}
          </span>
        </div>
      )}
      
      {/* Progress Bar */}
      <div className={`w-full ${sizeClasses[size]} bg-gray-700 rounded-full overflow-hidden`}>
        <div
          className={`${sizeClasses[size]} ${colors.bg} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Confidence Badge */}
      {showLabel && (
        <div className="mt-2 flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${colors.bg} animate-pulse ${colors.glow} shadow-lg`} />
          <span className={`text-xs font-semibold ${colors.text}`}>
            {color === 'green' && '✓ High Confidence'}
            {color === 'yellow' && '⚠ Medium Confidence'}
            {color === 'red' && '⚠ Low Confidence'}
          </span>
        </div>
      )}
    </div>
  );
};

export default ConfidenceIndicator;
