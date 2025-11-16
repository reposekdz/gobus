import React from 'react';
import { StarIcon } from './icons';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  isInteractive?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  isInteractive = false,
  size = 'medium',
}) => {
  const [hoverRating, setHoverRating] = React.useState(0);

  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-8 h-8',
  };

  return (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const currentRating = hoverRating || rating;
        const starClass =
          star <= currentRating
            ? 'text-yellow-400'
            : 'text-gray-300 dark:text-gray-600';
        
        if (!isInteractive) {
          return (
            <span key={star} className="inline-block">
              <StarIcon className={`${sizeClasses[size]} ${starClass}`} />
            </span>
          );
        }
        
        return (
          <button
            key={star}
            onClick={() => onRatingChange && onRatingChange(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="transition-colors duration-200 cursor-pointer"
          >
            <StarIcon className={`${sizeClasses[size]} ${starClass}`} />
          </button>
        );
      })}
    </div>
  );
};
