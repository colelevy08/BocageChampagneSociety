/**
 * @file src/components/WineDetailModal.jsx
 * @description Full wine detail modal showing large image, tasting notes,
 * pricing, producer info, and category badge. Opens when tapping a wine card.
 * @importedBy src/pages/Menu.jsx
 * @imports src/components/ui/Modal.jsx, src/components/ui/Badge.jsx
 */

import Modal from './ui/Modal';
import Badge from './ui/Badge';
import { Wine as WineIcon, MapPin, Calendar, Star, Grape } from 'lucide-react';

/**
 * WineDetailModal — displays full wine information in a slide-up modal.
 *
 * @param {object} props
 * @param {object|null} props.wine - Wine object to display
 * @param {boolean} props.isOpen - Whether the modal is visible
 * @param {Function} props.onClose - Close handler
 * @returns {JSX.Element}
 */
export default function WineDetailModal({ wine, isOpen, onClose }) {
  if (!wine) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="md" showClose={true}>
      {/* Large image */}
      {wine.image_url ? (
        <div className="relative -mx-5 -mt-3 mb-4">
          <img
            src={wine.image_url}
            alt={wine.name}
            className="w-full h-56 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-noir-800 to-transparent" />
        </div>
      ) : (
        <div className="relative -mx-5 -mt-3 mb-4 h-32 bg-noir-700 flex items-center justify-center">
          <WineIcon className="text-noir-500" size={48} />
        </div>
      )}

      {/* Title + featured badge */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h2 className="font-display text-2xl text-white leading-tight">{wine.name}</h2>
        {wine.is_featured && (
          <Badge variant="gold">
            <Star size={10} fill="currentColor" className="mr-0.5" />
            Featured
          </Badge>
        )}
      </div>

      {/* Meta info */}
      <div className="flex flex-wrap gap-2 mb-4">
        {wine.category && (
          <Badge variant="gray">
            {wine.category.charAt(0).toUpperCase() + wine.category.slice(1)}
          </Badge>
        )}
        {wine.vintage && (
          <Badge variant="gray">
            <Calendar size={10} className="mr-0.5" />
            {wine.vintage}
          </Badge>
        )}
      </div>

      {/* Producer + Region */}
      <div className="space-y-2 mb-4">
        {wine.producer && (
          <div className="flex items-center gap-2 text-sm font-sans text-noir-300">
            <Grape size={14} className="text-champagne-600 flex-shrink-0" />
            <span>Producer: <span className="text-white">{wine.producer}</span></span>
          </div>
        )}
        {wine.region && (
          <div className="flex items-center gap-2 text-sm font-sans text-noir-300">
            <MapPin size={14} className="text-champagne-600 flex-shrink-0" />
            <span>Region: <span className="text-white">{wine.region}</span></span>
          </div>
        )}
      </div>

      {/* Tasting notes */}
      {wine.description && (
        <div className="mb-6">
          <h3 className="font-sans text-xs text-noir-400 uppercase tracking-wider mb-2">
            Tasting Notes
          </h3>
          <p className="font-serif text-base text-noir-200 leading-relaxed">
            {wine.description}
          </p>
        </div>
      )}

      {/* Pricing */}
      <div className="flex items-center gap-4 p-4 bg-noir-800 rounded-xl">
        {wine.price_glass && (
          <div className="flex-1 text-center">
            <p className="font-display text-2xl text-champagne-500">
              ${Number(wine.price_glass).toLocaleString()}
            </p>
            <p className="font-sans text-xs text-noir-400 mt-0.5">Per Glass</p>
          </div>
        )}
        {wine.price_glass && wine.price_bottle && (
          <div className="w-px h-10 bg-noir-600" />
        )}
        {wine.price_bottle && (
          <div className="flex-1 text-center">
            <p className="font-display text-2xl text-champagne-300">
              ${Number(wine.price_bottle).toLocaleString()}
            </p>
            <p className="font-sans text-xs text-noir-400 mt-0.5">Per Bottle</p>
          </div>
        )}
      </div>

      {/* Stock indicator */}
      {wine.stock_count !== null && wine.stock_count !== undefined && (
        <p className="text-center text-xs font-sans text-noir-500 mt-3">
          {wine.stock_count > 0
            ? `${wine.stock_count} ${wine.stock_count === 1 ? 'bottle' : 'bottles'} available`
            : 'Currently unavailable'}
        </p>
      )}
    </Modal>
  );
}
