import React, { useState, useEffect } from 'react';
import customFetch from '../api/customFetch';
import toast from 'react-hot-toast';
import { useAppSelector } from '../app/hooks';

interface FileUploadProps {
    orderId: number;
    onUploadSuccess: () => void;
    existingProofUrl?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ orderId, onUploadSuccess, existingProofUrl }) => {
    const [proof, setProof] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(existingProofUrl || null);
    const [uploading, setUploading] = useState(false);
    const { token } = useAppSelector((state) => state.auth);

    useEffect(() => {
        setPreviewUrl(existingProofUrl || null);
    }, [existingProofUrl]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setProof(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleProofUpload = async () => {
        if (!proof) {
            toast.error('Por favor, selecciona un archivo nuevo para subir.');
            return;
        }
        if (!token) {
            toast.error('No estás autenticado.');
            return;
        }

        const formData = new FormData();
        formData.append('proof', proof);

        setUploading(true);
        try {
            await customFetch.post(`/orders/${orderId}/upload-proof`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`,
                },
            });
            toast.success('Comprobante subido exitosamente.');
            onUploadSuccess();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al subir el comprobante.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="mt-4">
            <h3 className="font-semibold">{existingProofUrl ? 'Cambiar comprobante de pago' : 'Adjuntar comprobante de pago'}</h3>
            {previewUrl ? (
                <div className="mt-4 text-center">
                    <img
                        src={
                            previewUrl.startsWith('blob:')
                                ? previewUrl
                                : previewUrl.includes('firebasestorage.app')
                                    ? previewUrl
                                    : `${import.meta.env.VITE_API_URL}${previewUrl}`
                        }
                        alt="Preview"
                        className="max-h-48 rounded-lg mx-auto"
                    />
                    <label htmlFor={`dropzone-file-${orderId}`} className="mt-2 text-sm text-blue-600 hover:underline cursor-pointer">
                        {existingProofUrl ? 'Seleccionar otro archivo' : 'Quitar imagen'}
                    </label>
                    <input id={`dropzone-file-${orderId}`} type="file" accept="image/png, image/jpeg, image/gif" className="hidden" onChange={handleFileChange} />
                </div>
            ) : (
                <div className="flex items-center justify-center w-full mt-2">
                    <label htmlFor={`dropzone-file-${orderId}`} className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                            </svg>
                            <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click para subir</span></p>
                            <p className="text-xs text-gray-500">PNG, JPG or GIF</p>
                        </div>
                        <input id={`dropzone-file-${orderId}`} type="file" accept="image/png, image/jpeg, image/gif" className="hidden" onChange={handleFileChange} />
                    </label>
                </div>
            )}
            <button
                onClick={handleProofUpload}
                disabled={uploading || !proof}
                className="mt-4 w-full bg-secondary hover:bg-opacity-90 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
            >
                {uploading ? 'Subiendo...' : (existingProofUrl ? 'Actualizar Comprobante' : 'Subir Comprobante')}
            </button>
        </div>
    );
};

export default FileUpload;