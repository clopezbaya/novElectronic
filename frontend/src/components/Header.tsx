import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FaShoppingCart, FaBars, FaTimes, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { useAppSelector } from '../app/hooks';
import logo from '../assets/logo1.png';
import customFetch from '../api/customFetch';

const Header = () => {
  const { numItemsInCart } = useAppSelector((state: any) => state.cart);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBrandMenuOpen, setIsBrandMenuOpen] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isMobileBrandAccordionOpen, setIsMobileBrandAccordionOpen] = useState(false);
  const [isMobileCategoryAccordionOpen, setIsMobileCategoryAccordionOpen] = useState(false);
  const [brands, setBrands] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const brandMenuRef = useRef<HTMLDivElement>(null);
  const categoryMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await customFetch.get('/brands');
        setBrands(response.data);
      } catch (error) {
        console.error('Error fetching brands:', error);
      }
    };
    const fetchCategories = async () => {
      try {
        const response = await customFetch.get('/categories');
        setCategories(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchBrands();
    fetchCategories();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (brandMenuRef.current && !brandMenuRef.current.contains(event.target as Node)) {
        setIsBrandMenuOpen(false);
      }
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target as Node)) {
        setIsCategoryMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [brandMenuRef, categoryMenuRef]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    setIsMobileBrandAccordionOpen(false);
    setIsMobileCategoryAccordionOpen(false);
  };

  const toggleBrandMenu = () => {
    setIsBrandMenuOpen(!isBrandMenuOpen);
    setIsCategoryMenuOpen(false);
  };

  const toggleCategoryMenu = () => {
    setIsCategoryMenuOpen(!isCategoryMenuOpen);
    setIsBrandMenuOpen(false);
  };

  return (
    <header className="bg-gray-900 text-white p-3 shadow-md sticky top-0 z-50">
      <nav className="flex justify-between items-center px-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
            <Link to="/" className="flex items-center text-xl font-bold tracking-wide text-gray-100 hover:text-gray-400 transition-colors duration-200">
              <img src={logo} alt="NovElectronic Logo" className="h-10 w-auto" />
            </Link>
        </div>
        
        <div className="hidden md:flex items-center space-x-4">
          <Link to="/" className="text-lg font-bold text-gray-100 hover:text-gray-400 transition-colors duration-200">Inicio</Link>
          
          <div className="relative" ref={brandMenuRef}>
              <button onClick={toggleBrandMenu} className="flex items-center text-lg font-bold text-gray-100 hover:text-gray-400 transition-colors duration-200">
                Marcas <FaChevronDown className="ml-1" />
              </button>
              {isBrandMenuOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10">
                  <div className="py-1">
                    {brands.map(brand => (
                      <Link
                        key={brand}
                        to={`/brands/${brand}`}
                        onClick={() => setIsBrandMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {brand}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
          </div>
          
          <div className="relative" ref={categoryMenuRef}>
              <button onClick={toggleCategoryMenu} className="flex items-center text-lg font-bold text-gray-100 hover:text-gray-400 transition-colors duration-200">
                Categorías <FaChevronDown className="ml-1" />
              </button>
              {isCategoryMenuOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10">
                  <div className="py-1">
                    {categories.map(category => (
                      <Link
                        key={category}
                        to={`/categories/${category}`}
                        onClick={() => setIsCategoryMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {category}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
          </div>

          <Link to="/cart" className="relative text-lg font-bold text-gray-100 hover:text-gray-400 transition-colors duration-200 flex items-center">
            <FaShoppingCart className="text-lg" />
            <span className="ml-1">Carrito</span>
            {numItemsInCart > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {numItemsInCart}
              </span>
            )}
          </Link>
        </div>

        <div className="md:hidden">
          <button onClick={toggleMenu} className="text-gray-100 hover:text-gray-400 focus:outline-none">
            {isMenuOpen ? <FaTimes className="text-2xl" /> : <FaBars className="text-2xl" />}
          </button>
        </div>
      </nav>

      {isMenuOpen && (
        <div className="md:hidden bg-gray-800">
          <div className="flex flex-col items-center py-4 space-y-4">
            <Link to="/" onClick={toggleMenu} className="text-lg font-bold text-gray-100 hover:text-gray-400 transition-colors duration-200">Inicio</Link>
            
            <div className="w-full flex flex-col items-center">
              <button onClick={() => setIsMobileBrandAccordionOpen(!isMobileBrandAccordionOpen)} className="flex justify-center items-center w-full max-w-xs text-lg font-bold text-gray-100 hover:text-gray-400 transition-colors duration-200 py-2">
                <span>Marcas</span>
                {isMobileBrandAccordionOpen ? <FaChevronUp className="ml-2" /> : <FaChevronDown className="ml-2" />}
              </button>
              {isMobileBrandAccordionOpen && (
                <div className="flex flex-col items-center space-y-2 mt-2 w-full max-w-xs">
                  {brands.map(brand => (
                    <Link
                      key={brand}
                      to={`/brands/${brand}`}
                      onClick={toggleMenu}
                      className="text-lg text-gray-300 hover:text-gray-100 w-full text-center"
                    >
                      {brand}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            
            <div className="w-full flex flex-col items-center">
              <button onClick={() => setIsMobileCategoryAccordionOpen(!isMobileCategoryAccordionOpen)} className="flex justify-center items-center w-full max-w-xs text-lg font-bold text-gray-100 hover:text-gray-400 transition-colors duration-200 py-2">
                <span>Categorías</span>
                {isMobileCategoryAccordionOpen ? <FaChevronUp className="ml-2" /> : <FaChevronDown className="ml-2" />}
              </button>
              {isMobileCategoryAccordionOpen && (
                <div className="flex flex-col items-center space-y-2 mt-2 w-full max-w-xs">
                  {categories.map(category => (
                    <Link
                      key={category}
                      to={`/categories/${category}`}
                      onClick={toggleMenu}
                      className="text-lg text-gray-300 hover:text-gray-100 w-full text-center"
                    >
                      {category}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link to="/cart" onClick={toggleMenu} className="relative text-lg font-bold text-gray-100 hover:text-gray-400 transition-colors duration-200 flex items-center">
              <FaShoppingCart className="text-lg" />
              <span className="ml-1">Carrito</span>
              {numItemsInCart > 0 && (
                <span className="absolute -top-2 -right-10 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {numItemsInCart}
                </span>
              )}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;