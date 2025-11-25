import React from 'react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../utils/formatPrice';

interface ProductCardProps {
  id: string;
  title: string;
  image: string;
  price: number;
  currency: string;
}

const ProductCard: React.FC<ProductCardProps> = ({ id, title, image, price, currency }) => {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-xl transition-all duration-300">
      <Link to={`/product/${id}`} className="flex flex-col h-full">
        <div className="aspect-square w-full overflow-hidden bg-gray-100">
          <img
            src={image}
            alt={title}
            className="h-full w-full object-contain object-center group-hover:opacity-80 transition-opacity duration-300"
          />
        </div>
        <div className="p-4 flex flex-col flex-grow text-center">
          <h3 className="text-md font-semibold text-gray-800">
            <span aria-hidden="true" className="absolute inset-0" />
            {title}
          </h3>
          <p className="mt-2 text-lg font-bold text-gray-900">
            {formatPrice(price, currency)}
          </p>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
