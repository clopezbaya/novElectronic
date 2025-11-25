import React, { useEffect, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector, useDebounce } from '../app/hooks';
import customFetch from '../api/customFetch';
import { setProducts, addProducts, setLoading, setError } from '../features/products/productSlice';
import ProductCard from '../components/ProductCard';
import { nanoid } from 'nanoid';
import { FaExclamationTriangle, FaBoxOpen } from 'react-icons/fa';

const HomePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { products, totalProducts, isLoading, error } = useAppSelector((state: any) => state.product);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const debouncedSearch = useDebounce(searchTerm, 500);
  const limit = 8;

  const fetchProducts = useCallback(async (pageNum: number, search: string) => {
    dispatch(setLoading(true));
    try {
      const queryParams = new URLSearchParams({
        page: pageNum.toString(),
        limit: limit.toString(),
      });
      if (search) {
        queryParams.append('search', search);
      }
      const response = await customFetch.get(`/products?${queryParams.toString()}`);
      if (pageNum === 1) {
        dispatch(setProducts(response.data));
      } else {
        dispatch(addProducts(response.data));
      }
    } catch (err: any) {
      console.error('Error fetching products:', err);
      dispatch(setError('Fallo al cargar productos. Por favor, intente de nuevo más tarde.'));
    }
  }, [dispatch]);

  useEffect(() => {
    setPage(1);
    fetchProducts(1, debouncedSearch);
  }, [fetchProducts, debouncedSearch]);

  useEffect(() => {
    if (page > 1) {
      fetchProducts(page, debouncedSearch);
    }
  }, [page]);


  const handleLoadMore = () => {
    setPage(prevPage => prevPage + 1);
  };

  if (isLoading && page === 1) {
    return (
        <div className="flex flex-col items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
            <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="w-8 h-8 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-8 h-8 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                <p className="text-2xl text-gray-700 ml-4 mt-4">Cargando...</p>
            </div>
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
                    onClick={() => fetchProducts(1, debouncedSearch)}
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
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        <div className="flex justify-between items-center mb-8">
            <div className="flex-1">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Nuestros Últimos Productos
                </h2>
                <p className="mt-4 text-lg text-gray-600">
                Descubre nuestra nueva colección de productos. Tenemos algo para todos.
                </p>
            </div>
            <input
                type="text"
                placeholder="Buscar en todos los productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-1/3 p-2 border border-gray-300 rounded-md"
            />
        </div>

        <div className="mt-6">
          <p className="text-sm text-gray-500">
            Mostrando {products.length} de {totalProducts} productos
          </p>
        </div>

        {products.length > 0 ? (
            <>
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

                {products.length < totalProducts && (
                <div className="mt-10 text-center">
                    <button
                    onClick={handleLoadMore}
                    disabled={isLoading}
                    className="bg-gray-900 text-white font-bold py-3 px-8 rounded-lg shadow-md hover:bg-gray-700 transition duration-300 disabled:opacity-50"
                    >
                    {isLoading ? 'Cargando...' : 'Ver Más'}
                    </button>
                </div>
                )}
            </>
        ) : (
            <div className="text-center py-16">
                <FaBoxOpen className="text-7xl text-gray-400 mb-6 mx-auto" />
                <h1 className="text-3xl font-bold text-gray-800 mb-2">No se encontraron productos</h1>
                <p className="text-gray-600">No hay productos que coincidan con tu búsqueda.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
