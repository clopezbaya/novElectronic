import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import customFetch from '../api/customFetch';
import { formatPrice } from '../utils/formatPrice';
import { useAppDispatch } from '../app/hooks';
import { addItem } from '../features/cart/cartSlice';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface Product {
  id: string;
  title: string;
  image: string;
  categories: string[];
  price: number;
  currency: string;
  popularity: number;
  stock: number;
  description?: string; // Added description field
}

const SingleProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const categoryTranslations: { [key: string]: string } = {
    "Electronics": "Electrónica",
    "Smartphones": "Smartphones", // Example, add more as needed
    "Laptops": "Portátiles", // Example, add more as needed
    "Accessories": "Accesorios", // Example, add more as needed
    // Add other English categories and their Spanish translations here
  };

  const getTranslatedCategory = (category: string) => {
    return categoryTranslations[category] || category;
  };

  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await customFetch.get(`/products/${id}`);
        setProduct(response.data);
      } catch (err: any) {
        console.error('Error fetching single product:', err);
        setError('Fallo al cargar los detalles del producto.');
      } finally {
        setIsLoading(false);
      }
    };
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const handleAddToCart = () => {
    if (product) {
      if (product.stock === 0) {
        toast.error('Este producto está agotado.');
        return;
      }
      if (quantity > product.stock) {
        toast.error(`Solo quedan ${product.stock} unidades en stock.`);
        return;
      }
      dispatch(
        addItem({
          productId: product.id,
          title: product.title,
          image: product.image,
          price: product.price,
          currency: product.currency,
          quantity,
          category: product.categories && product.categories.length > 0 ? product.categories[0] : '',
          popularity: product.popularity,
          stock: product.stock,
        })
      );
      toast.success(`${quantity} x ${product.title} añadido al carrito!`);
    }
  };

  const handleBuyNow = () => {
    if (product) {
      if (product.stock === 0) {
        toast.error('Este producto está agotado.');
        return;
      }
      if (quantity > product.stock) {
        toast.error(`Solo quedan ${product.stock} unidades en stock.`);
        return;
      }
      dispatch(
        addItem({
          productId: product.id,
          title: product.title,
          image: product.image,
          price: product.price,
          currency: product.currency,
          quantity,
          category: product.categories && product.categories.length > 0 ? product.categories[0] : '',
          popularity: product.popularity,
          stock: product.stock,
        })
      );
      navigate('/cart');
    }
  };

  // Loading, Error, and Not Found states
  if (isLoading) {
    return <div className="text-center py-20 text-xl">Cargando...</div>;
  }
  if (error) {
    return <div className="text-center py-20 text-xl text-red-500">Error: Fallo al cargar los detalles del producto.</div>;
  }
  if (!product) {
    return <div className="text-center py-20 text-xl">Producto no encontrado.</div>;
  }

  return (
    <div className="bg-white">
      <div className="pt-6">
        <div className="mx-auto max-w-2xl px-4 pb-16 pt-10 sm:px-6 lg:max-w-7xl lg:px-8">
            <div className="lg:grid lg:grid-cols-2 lg:gap-x-8">
                {/* Image gallery */}
                <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-lg">
                    <img
                    src={product.image}
                    alt={product.title}
                    className="h-full w-full object-contain object-center"
                    />
                </div>

                {/* Product info */}
                <div className="mt-10 lg:mt-0">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">{product.title}</h1>
                    <p className="mt-2 text-sm text-gray-500">{product.categories && product.categories.length > 0 ? getTranslatedCategory(product.categories[0]) : 'Sin categoría'}</p>
                    
                    <div className="mt-4">
                        <h2 className="sr-only">Información del producto</h2>
                        <p className="text-3xl tracking-tight text-gray-900">{formatPrice(product.price * quantity, product.currency)}</p>
                    </div>

                    <div className="mt-6">
                        <h3 className="sr-only">Disponibilidad</h3>
                        <div className="flex items-center">
                            <p className="text-sm font-medium text-gray-900">
                            {product.stock > 0 ? 'En Stock' : 'Agotado'}
                            </p>
                        </div>
                    </div>

                    <form className="mt-6">
                        <div>
                            <h3 className="text-sm font-medium text-gray-700">Cantidad</h3>
                            <div className="mt-1">
                            <input
                                type="number"
                                id="quantity"
                                min="1"
                                max={product.stock}
                                value={quantity}
                                onChange={(e) => setQuantity(parseInt(e.target.value))}
                                className="w-20 rounded-md border border-gray-300 py-1.5 text-center text-base font-medium leading-5 text-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                disabled={product.stock === 0}
                            />
                            </div>
                        </div>

                        <div className="mt-10 flex flex-col space-y-4">
                            <button
                            type="button"
                            onClick={handleBuyNow}
                            className="flex w-full items-center justify-center rounded-md border border-transparent bg-secondary px-8 py-3 text-base font-medium text-white hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={product.stock === 0}
                            >
                            Compra ya
                            </button>
                            <button
                            type="button"
                            onClick={handleAddToCart}
                            className="flex w-full items-center justify-center rounded-md border border-transparent bg-gray-900 px-8 py-3 text-base font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={product.stock === 0}
                            >
                            Añadir al carrito
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            <div className="py-10 lg:pt-16">
                {/* Description and details */}
                <div>
                <h3 className="text-xl font-bold text-gray-900">Descripción</h3>

                <div className="mt-4 space-y-6">
                    <p className="text-base text-gray-900">{product.description || 'No hay descripción disponible para este producto.'}</p>
                </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SingleProductPage;
