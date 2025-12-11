import React, { useState } from 'react';
import customFetch from '../api/customFetch';
import toast from 'react-hot-toast';
import { useAppSelector } from '../app/hooks';

interface ShippingProofUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number | null;
  onUploadSuccess: () => void;
}

const ShippingProofUploadModal: React.FC<ShippingProofUploadModalProps> = ({ isOpen, onClose, orderId, onUploadSuccess }) => {
  const [shippingProof, setShippingProof] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useAppSelector((state: any) => state.auth);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setShippingProof(e.target.files[0]);
    } else {
      setShippingProof(null);
    }
  };

  const handleSubmit = async () => {
    if (!orderId || !shippingProof) {
      toast.error('Por favor, selecciona un comprobante de envío.');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('shippingProof', shippingProof);

      await customFetch.post(`/admin/orders/${orderId}/ship`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success('Comprobante de envío cargado y estado actualizado a "Enviado"!');
      onUploadSuccess();
      onClose();
      setShippingProof(null); // Clear selected file
    } catch (error) {
      console.error('Error al subir el comprobante de envío:', error);
      toast.error('Error al subir el comprobante de envío.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
        <h2 className="text-xl font-bold mb-4">Cargar Comprobante de Envío</h2>
        <p className="text-gray-700 mb-4">
          Por favor, adjunta el comprobante de envío para el pedido #{orderId}.
        </p>
        <input
          type="file"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 mb-4"
        />
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            disabled={!shippingProof || isLoading}
          >
            {isLoading ? 'Cargando...' : 'Cargar y Enviar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShippingProofUploadModal;
