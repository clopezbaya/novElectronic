import React, { useState, useEffect } from 'react';
import type { Brand, Category, ProductFormData } from '../types/index.ts';

interface ProductFormProps {
    brands: Brand[];
    categories: Category[];
    onSubmit: (e: React.FormEvent) => void;
    onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    onCategoryChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    loading: boolean;
    productData: ProductFormData | null; // Can be null initially
    isEditing: boolean;
}

const ProductForm: React.FC<ProductFormProps> = ({ brands, categories, onSubmit, onFormChange, onCategoryChange, loading, productData, isEditing }) => {
    
    const [errors, setErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({});

    useEffect(() => {
        if (!productData) return;
        const newErrors: Partial<Record<keyof ProductFormData, string>> = {};
        if (productData.originalPrice < 0) {
            newErrors.originalPrice = 'El precio original no puede ser negativo.';
        }
        if (productData.resalePrice < 0) {
            newErrors.resalePrice = 'El precio de venta no puede ser negativo.';
        }
        if (productData.stock < 0) {
            newErrors.stock = 'El stock no puede ser negativo.';
        }
        if (productData.resalePrice < productData.originalPrice) {
            newErrors.resalePrice = 'El precio de venta no puede ser menor que el precio original.';
        }
        setErrors(newErrors);
    }, [productData]);

    const isFormInvalid = Object.keys(errors).length > 0;

    // Floating label styles
    const inputContainerClass = "relative";
    const inputClass = "block px-3.5 pb-2.5 pt-5 w-full text-base text-gray-900 bg-transparent rounded-lg border border-gray-400 appearance-none focus:outline-none focus:ring-0 focus:border-gray-900 peer";
    const labelClass = "absolute text-base text-gray-500 duration-300 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] start-3.5 peer-focus:text-gray-900 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto";

    if (!productData) {
        return <div className="text-center">Cargando formulario...</div>;
    }

    return (
        <form onSubmit={onSubmit} className="space-y-8">
            {/* Name */}
            <div className={inputContainerClass}>
                <input type="text" name="name" id="name" value={productData.name} onChange={onFormChange} className={inputClass} placeholder=" " required />
                <label htmlFor="name" className={labelClass}>Nombre del Producto</label>
            </div>

            {/* Description */}
            <div className={inputContainerClass}>
                <textarea name="description" id="description" rows={5} value={productData.description} onChange={onFormChange} className={inputClass} placeholder=" " />
                <label htmlFor="description" className={labelClass}>Descripción</label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Original Price */}
                <div className={inputContainerClass}>
                    <input type="number" step="0.01" name="originalPrice" id="originalPrice" value={productData.originalPrice} onChange={onFormChange} className={inputClass} placeholder=" " />
                    <label htmlFor="originalPrice" className={labelClass}>Precio Original (Bs)</label>
                    {errors.originalPrice && <p className="text-red-600 text-xs mt-1 absolute">{errors.originalPrice}</p>}
                </div>
                {/* Resale Price */}
                <div className={inputContainerClass}>
                    <input type="number" step="0.01" name="resalePrice" id="resalePrice" value={productData.resalePrice} onChange={onFormChange} className={inputClass} placeholder=" " required />
                    <label htmlFor="resalePrice" className={labelClass}>Precio de Venta (Bs)</label>
                    {errors.resalePrice && <p className="text-red-600 text-xs mt-1 absolute">{errors.resalePrice}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Stock */}
                <div className={inputContainerClass}>
                    <input type="number" name="stock" id="stock" value={productData.stock} onChange={onFormChange} className={inputClass} placeholder=" " required />
                    <label htmlFor="stock" className={labelClass}>Stock</label>
                    {errors.stock && <p className="text-red-600 text-xs mt-1 absolute">{errors.stock}</p>}
                </div>
                {/* Brand */}
                <div className={inputContainerClass}>
                    <select name="brandId" id="brandId" value={productData.brandId} onChange={onFormChange} className={inputClass} required>
                        <option value="" disabled hidden></option>
                        {brands.map(brand => (
                            <option key={brand.id} value={brand.id}>{brand.name}</option>
                        ))}
                    </select>
                    <label htmlFor="brandId" className={labelClass}>Marca</label>
                </div>
            </div>

            {/* Image URL */}
             <div className={inputContainerClass}>
                <input type="text" name="imageUrl" id="imageUrl" value={productData.imageUrl} onChange={onFormChange} className={inputClass} placeholder=" " required />
                <label htmlFor="imageUrl" className={labelClass}>URL de la Imagen</label>
                {productData.imageUrl && (
                    <div className="mt-4">
                        <img src={productData.imageUrl} alt="Previsualización" className="w-48 h-48 object-contain rounded-lg border border-gray-300 bg-gray-50 p-1" />
                    </div>
                )}
            </div>

            {/* Source URL */}
            <div className={inputContainerClass}>
                <input type="text" name="sourceUrl" id="sourceUrl" value={productData.sourceUrl} onChange={onFormChange} className={inputClass} placeholder=" " required />
                <label htmlFor="sourceUrl" className={labelClass}>URL de Origen</label>
            </div>

            {/* Categories */}
            <div>
                <h4 className="text-base font-medium text-gray-800 mb-4">Categorías</h4>
                <div className="mt-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {categories.map(category => (
                        <div key={category.id} className="flex items-center p-2 border rounded-lg hover:bg-gray-50">
                            <input
                                id={`category-${category.id}`}
                                name="categoryIds"
                                type="checkbox"
                                value={category.id}
                                checked={productData.categoryIds.includes(category.id)}
                                onChange={onCategoryChange}
                                className="h-5 w-5 text-gray-900 border-gray-400 rounded focus:ring-gray-900"
                            />
                            <label htmlFor={`category-${category.id}`} className="ml-3 text-base text-gray-800">{category.name}</label>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="flex justify-end pt-6 border-t border-gray-200">
                <button type="submit" className="bg-gray-900 text-white px-8 py-3 rounded-lg text-base font-medium hover:bg-gray-700 disabled:opacity-50" disabled={loading || isFormInvalid}>
                    {loading ? 'Guardando...' : (isEditing ? 'Actualizar Producto' : 'Crear Producto')}
                </button>
            </div>
        </form>
    );
};

export default ProductForm;
