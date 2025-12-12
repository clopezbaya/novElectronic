import React from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  const getPaginationItems = () => {
    const items: (number | string)[] = [];
    const pageRange = 2; // How many pages to show around the current page

    // Always add the first page
    items.push(1);

    // Add ellipsis if needed
    if (currentPage > pageRange + 2) {
      items.push('...');
    }

    // Add pages around the current page
    for (let i = Math.max(2, currentPage - pageRange); i <= Math.min(totalPages - 1, currentPage + pageRange); i++) {
      items.push(i);
    }

    // Add ellipsis if needed
    if (currentPage < totalPages - pageRange - 1) {
      items.push('...');
    }
    
    // Always add the last page if there is more than 1 page
    if (totalPages > 1) {
      items.push(totalPages);
    }

    return items;
  };

  const paginationItems = getPaginationItems();

  if (totalPages <= 1) {
    return null; // Don't render pagination if there's only one page
  }

  return (
    <nav className="flex items-center justify-center space-x-2" aria-label="Pagination">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="relative inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-100 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FaChevronLeft className="h-4 w-4" aria-hidden="true" />
        <span className="ml-2">Anterior</span>
      </button>

      {paginationItems.map((item, index) =>
        typeof item === 'number' ? (
          <button
            key={`${item}-${index}`}
            onClick={() => onPageChange(item)}
            className={`relative inline-flex items-center rounded-md px-4 py-2 text-sm font-semibold ${
              item === currentPage
                ? 'z-10 bg-gray-900 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900'
                : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-100'
            }`}
            aria-current={item === currentPage ? 'page' : undefined}
          >
            {item}
          </button>
        ) : (
          <span key={`ellipsis-${index}`} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700">
            ...
          </span>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="relative inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-100 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="mr-2">Siguiente</span>
        <FaChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </nav>
  );
};

export default Pagination;
