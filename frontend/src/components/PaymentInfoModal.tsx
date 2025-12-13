import React from 'react';
import PaymentInstructions from './PaymentInstructions';

interface PaymentInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    handleImageClick: (url: string) => void;
}

const PaymentInfoModal: React.FC<PaymentInfoModalProps> = ({ isOpen, onClose, handleImageClick }) => {
    if (!isOpen) return null;

    return (
        <div 
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 transition-opacity duration-300"
        >
            <div 
                onClick={(e) => e.stopPropagation()}
                className="bg-gray-100 p-6 rounded-lg shadow-xl max-w-lg w-full relative animate-fade-in-down"
            >
                <div className="flex justify-between items-center mb-4 border-b pb-3">
                    <h2 className="text-2xl font-bold text-gray-800">Información de Pago</h2>
                    <button 
                        onClick={onClose} 
                        className="text-gray-500 hover:text-gray-800 text-3xl font-bold leading-none"
                        aria-label="Cerrar modal"
                    >
                        &times;
                    </button>
                </div>
                
                <PaymentInstructions handleImageClick={handleImageClick} />
                
                <button 
                    onClick={onClose} 
                    className="mt-6 w-full bg-gray-800 text-white py-2 rounded-lg hover:bg-gray-700 transition"
                >
                    Cerrar
                </button>
            </div>
        </div>
    );
};

export default PaymentInfoModal;