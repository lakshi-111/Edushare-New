import { Star } from 'lucide-react';

export default function RatingStars({ value = 0, onChange = null, size = 18 }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= value;
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange && onChange(star)}
            className={onChange ? 'cursor-pointer' : 'cursor-default'}
          >
            <Star
              size={size}
              className={active ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
            />
          </button>
        );
      })}
    </div>
  );
}
