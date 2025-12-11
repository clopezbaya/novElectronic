import React from 'react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50"
            onClick={onClose}
        >
            <div 
                className="bg-white p-8 rounded-lg shadow-2xl max-w-sm w-full mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-2xl font-bold text-gray-800 mb-4">{title}</h2>
                <p className="text-gray-600 mb-8">{message}</p>
                <div className="flex justify-end space-x-4">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2 rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300 focus:outline-none"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={onConfirm}
                        className="px-6 py-2 rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none"
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
