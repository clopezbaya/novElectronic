import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAppSelector, useDebounce } from '../app/hooks';
import customFetch from '../api/customFetch';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

interface Product {
    id: string;
    name: string;
    resalePrice: number;
    stock: number;
    brand: { name: string };
    categories: { name: string }[];
}

const AdminProductsPage: React.FC = () => {
    const { token } = useAppSelector((state) => state.auth);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);

    const debouncedSearch = useDebounce(searchTerm, 500);

    const fetchProducts = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '10',
            });
            if (debouncedSearch) {
                params.append('search', debouncedSearch);
            }

            const response = await customFetch.get(`/admin/products?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProducts(response.data.products);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            toast.error('Error al cargar productos.');
        } finally {
            setIsLoading(false);
            searchInputRef.current?.focus();
        }
    }, [token, page, debouncedSearch]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleDelete = async (productId: string) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
            try {
                await customFetch.delete(`/admin/products/${productId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success('Producto eliminado exitosamente.');
                fetchProducts(); // Re-fetch products after deletion
            } catch (error) {
                toast.error('Error al eliminar el producto.');
            }
        }
    };

    if (isLoading) {
        return <div className="p-8">Cargando productos...</div>;
    }

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8 gap-4">
                <h1 className="text-3xl font-bold text-gray-800">Gestión de Productos</h1>
                <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Buscar productos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="p-2 border border-gray-300 rounded-md w-1/3"
                />
                <div>
                    <Link to="/admin" className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 mr-4">
                        Ver Pedidos
                    </Link>
                    <Link to="/admin/products/new" className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
                        Añadir Producto
                    </Link>
                </div>
            </div>
            <div className="bg-white shadow-xl rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-800">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Nombre</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Marca</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Categorías</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Precio</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Stock</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {products.map(product => (
                            <tr key={product.id}>
                                <td className="px-6 py-4 whitespace-nowrap">{product.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{product.brand.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{product.categories.map(c => c.name).join(', ')}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{product.resalePrice}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{product.stock}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <Link to={`/admin/products/edit/${product.id}`} className="text-indigo-600 hover:text-indigo-900">Editar</Link>
                                    <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900 ml-4">Eliminar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             <div className="flex justify-between items-center mt-4">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 bg-gray-300 rounded-md disabled:opacity-50">
                    Anterior
                </button>
                <span>Página {page} de {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 bg-gray-300 rounded-md disabled:opacity-50">
                    Siguiente
                </button>
            </div>
        </div>
    );
};

export default AdminProductsPage;
