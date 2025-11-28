import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import customFetch from '../api/customFetch';
import toast from 'react-hot-toast';
import ProductForm from '../components/ProductForm';
import { useAppSelector } from '../app/hooks';
import type { Brand, Category, Product, ProductFormData } from '../types/index.ts';

const EditProductPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { token } = useAppSelector((state) => state.auth);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [productData, setProductData] = useState<ProductFormData | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!token) return;
            try {
                const [productRes, brandsRes, categoriesRes] = await Promise.all([
                    customFetch.get<Product>(`/admin/products/${id}`, { 
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    customFetch.get<Brand[]>('/brands'),
                    customFetch.get<Category[]>('/categories')
                ]);

                const product = productRes.data;
                setProductData({
                    name: product.name,
                    description: product.description || '',
                    originalPrice: product.originalPrice,
                    resalePrice: product.resalePrice,
                    imageUrl: product.imageUrl,
                    sourceUrl: product.sourceUrl,
                    stock: product.stock,
                    brandId: product.brand.id,
                    categoryIds: product.categories.map((c) => c.id),
                });
                
                setBrands(brandsRes.data);
                setCategories(categoriesRes.data);
            } catch (error) {
                toast.error('Error al cargar los datos del producto.');
                navigate('/admin/products');
            }
        };
        fetchData();
    }, [id, token, navigate]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        // Keep the value as a string in the state to allow empty inputs
        setProductData(prev => prev ? ({ ...prev, [name]: value }) : null);
    };

    const handleCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const categoryId = parseInt(e.target.value);
        const isChecked = e.target.checked;

        setProductData(prev => {
            if (!prev) return null;
            const newCategoryIds = isChecked
                ? [...prev.categoryIds, categoryId]
                : prev.categoryIds.filter((id: number) => id !== categoryId);
            return { ...prev, categoryIds: newCategoryIds };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!productData) return;

        const payload = {
            ...productData,
            originalPrice: parseFloat(String(productData.originalPrice)) || 0,
            resalePrice: parseFloat(String(productData.resalePrice)) || 0,
            stock: parseInt(String(productData.stock), 10) || 0,
            brandId: parseInt(String(productData.brandId), 10),
            categoryIds: productData.categoryIds.map(id => parseInt(String(id), 10))
        };
        
        if (isNaN(payload.brandId)) {
            toast.error('Por favor, selecciona una marca válida.');
            return;
        }

        setLoading(true);
        try {
            await customFetch.put(`/admin/products/${id}`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Producto actualizado exitosamente.');
            navigate('/admin/products');
        } catch (error) {
            toast.error('Error al actualizar el producto.');
        } finally {
            setLoading(false);
        }
    };

    if (!productData) {
        return <div className="p-8 text-center text-xl">Cargando datos del producto...</div>;
    }

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Editar Producto</h1>
                <Link to="/admin/products" className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600">
                    Volver a Productos
                </Link>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg">
                <ProductForm
                    brands={brands}
                    categories={categories}
                    onSubmit={handleSubmit}
                    onFormChange={handleFormChange}
                    onCategoryChange={handleCategoryChange}
                    loading={loading}
                    productData={productData}
                />
            </div>
        </div>
    );
};

export default EditProductPage;
