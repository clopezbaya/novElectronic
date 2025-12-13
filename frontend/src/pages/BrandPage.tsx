import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import customFetch from '../api/customFetch';
import { setProducts, setLoading, setError, clearProducts } from '../features/products/productSlice';
import ProductCard from '../components/ProductCard';
import { nanoid } from 'nanoid';
import { FaExclamationTriangle, FaBoxOpen, FaSearch } from 'react-icons/fa';
import havitLogo from '../assets/havit.png';
import type { RootState } from '../app/store';

const BrandPage: React.FC = () => {
  const { brandName } = useParams<{ brandName: string }>();
  const dispatch = useAppDispatch();
  const { products, totalProducts, isLoading, error } = useAppSelector((state: RootState) => state.product);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');

  const fetchProducts = useCallback(async (search: string) => {
    dispatch(setLoading(true));
    try {
      const queryParams = new URLSearchParams({
        brand: brandName || '',
      });
      if (search) {
        queryParams.append('search', search);
      }
      const response = await customFetch.get(`/products?${queryParams.toString()}`);
      dispatch(setProducts(response.data));
    } catch (err: any) {
      console.error('Error fetching products:', err);
      dispatch(setError('Fallo al cargar productos. Por favor, intente de nuevo más tarde.'));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, brandName]);

  // Effect for initial load or when brand/search changes
  useEffect(() => {
    dispatch(clearProducts());
    fetchProducts(activeSearchTerm);
  }, [activeSearchTerm, brandName, dispatch, fetchProducts]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearchTerm(searchTerm);
  };

  const getBrandBanner = () => {
    if (brandName?.toLowerCase() === 'havit') {
      return (
        <img src={havitLogo} alt={`${brandName} Banner`} className="w-full h-auto" />
      );
    }
    return (
      <div className="flex items-center justify-center h-full">
        <h1 className="text-4xl font-bold text-gray-800">{brandName}</h1>
      </div>
    );
  };

  if (isLoading && products.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
            {/* Spinner JSX */}
        </div>
    );
  }

      if (error) {
        return (
            <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
                <div className="bg-white p-8 rounded-lg shadow-2xl max-w-md w-full text-center">
                    <FaExclamationTriangle className="text-7xl text-red-400 mb-6 mx-auto" />
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">¡Oops! Algo salió mal.</h1>
                    <p className="text-gray-600 mb-6">No pudimos cargar los productos. Por favor, revisa tu conexión e intenta de nuevo.</p>
                    <button
                        onClick={() => fetchProducts(activeSearchTerm)}
                        className="bg-red-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-red-600 transition duration-300 transform hover:scale-105"
                    >
                        Intentar de Nuevo
                    </button>
                </div>
            </div>
        );
      }
  return (
    <div className="bg-white">
      <div className="bg-gray-200 w-full">
        {getBrandBanner()}
      </div>

      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">Productos de {brandName}</h2>
            <form onSubmit={handleSearchSubmit} className="relative flex w-1/3">
                <input
                    type="text"
                    placeholder="Buscar en esta marca..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-l-md"
                />
                <button type="submit" className="p-2 bg-gray-800 text-white rounded-r-md hover:bg-gray-700">
                    <FaSearch />
                </button>
            </form>
        </div>

        <div className="mt-6">
          <p className="text-sm text-gray-500">
            Mostrando {products.length} de {totalProducts} productos
          </p>
        </div>

        {products.length > 0 ? (
            <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
            {products.map((product: any) => (
                <ProductCard
                key={nanoid()}
                id={product.id}
                title={product.title}
                image={product.image}
                price={product.price}
                currency={product.currency}
                />
            ))}
            </div>
        ) : (
            <div className="text-center py-16">
                <FaBoxOpen className="text-7xl text-gray-400 mb-6 mx-auto" />
                <h1 className="text-3xl font-bold text-gray-800 mb-2">No se encontraron productos</h1>
                <p className="text-gray-600">No hay productos que coincidan con los filtros actuales en esta marca.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default BrandPage;