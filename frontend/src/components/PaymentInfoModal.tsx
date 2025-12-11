import React from 'react';

interface PaymentInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PaymentInfoModal: React.FC<PaymentInfoModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const qrCodeImage = 'https://via.placeholder.com/200?text=QR+Code';
    const bankTransferDetails = {
        bankName: 'Banco Nacional de Bolivia',
        accountNumber: '123-456789-0',
        accountHolder: 'NovElectronic S.R.L.',
        identification: '123456789', // Example RUC/CI
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-lg w-full">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Información de Pago</h2>
                    <button onClick={onClose} className="text-2xl font-bold">&times;</button>
                </div>
                <div className='mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200'>
                    <h3 className='text-xl font-semibold mb-4 text-blue-800'>
                        Pago mediante Código QR
                    </h3>
                    <img
                        src={qrCodeImage}
                        alt='Código QR para Pago'
                        className='mx-auto w-48 h-48 border border-blue-300 p-2 rounded-md mb-3 shadow-md'
                    />
                </div>
                <div className='p-6 bg-green-50 rounded-lg border border-green-200 text-left'>
                    <h3 className='text-xl font-semibold mb-4 text-green-800'>
                        Transferencia Bancaria
                    </h3>
                    <p className="text-sm text-gray-800">
                        <strong>Banco:</strong> {bankTransferDetails.bankName}
                    </p>
                    <p className="text-sm text-gray-800">
                        <strong>Número de Cuenta:</strong> {bankTransferDetails.accountNumber}
                    </p>
                    <p className="text-sm text-gray-800">
                        <strong>Titular:</strong> {bankTransferDetails.accountHolder}
                    </p>
                    <p className="text-sm text-gray-800">
                        <strong>C.I./NIT:</strong> {bankTransferDetails.identification}
                    </p>
                </div>
                <button onClick={onClose} className="mt-6 w-full bg-gray-800 text-white py-2 rounded-lg">
                    Cerrar
                </button>
            </div>
        </div>
    );
};

export default PaymentInfoModal;
