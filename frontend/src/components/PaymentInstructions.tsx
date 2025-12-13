import React, { useState } from 'react';
import qrImage from '../assets/qr_image.jpg';
import { FaWhatsapp, FaQrcode, FaUniversity } from 'react-icons/fa';

interface PaymentInstructionsProps {
  handleImageClick: (url: string) => void;
}

const PaymentInstructions: React.FC<PaymentInstructionsProps> = ({ handleImageClick }) => {
  const [activeTab, setActiveTab] = useState<'qr' | 'transfer'>('qr');

  const bankTransferDetails = {
    bankName: 'Banco de Credito',
    accountNumber: '123-456789-0', // Placeholder
    accountHolder: 'Christian Lopez Baya',
    identification: '123456789', // Placeholder
  };

  const getButtonClass = (tabName: 'qr' | 'transfer') => {
    return `flex-1 py-3 px-4 text-center font-semibold transition-all duration-300 border-b-4 ${
      activeTab === tabName
        ? 'border-gray-900 text-gray-900'
        : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
    }`;
  };

  return (
    <div className="w-full mt-6 border rounded-lg shadow-md bg-white">
      {/* Tab Buttons */}
      <div className="flex border-b">
        <button onClick={() => setActiveTab('qr')} className={getButtonClass('qr')}>
          <FaQrcode className="inline-block mr-2" />
          Pago con QR
        </button>
        <button onClick={() => setActiveTab('transfer')} className={getButtonClass('transfer')}>
          <FaUniversity className="inline-block mr-2" />
          Transferencia Bancaria
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'qr' && (
          <div className="animate-fade-in text-blue-800 p-4 bg-blue-50 rounded-b-lg">
            <img
              src={qrImage}
              alt='Código QR para Pago'
              className='mx-auto w-48 h-48 border p-1 rounded-md mb-3 shadow-sm cursor-pointer hover:opacity-80 transition'
              onClick={() => handleImageClick(qrImage)}
            />
            <div className="text-center space-y-2">
                <p className='font-semibold text-lg'>
                    {bankTransferDetails.accountHolder}
                </p>
                <p className='text-sm text-gray-600'>
                    Depositar solo el monto exacto que aparece en su orden. <br/> Pagos con montos diferentes serán rechazados.
                </p>
            </div>
          </div>
        )}

        {activeTab === 'transfer' && (
          <div className="animate-fade-in text-left space-y-2 p-4 bg-green-50 rounded-b-lg text-gray-700">
            <p><strong>Banco:</strong> {bankTransferDetails.bankName}</p>
            <p><strong>Número de Cuenta:</strong> {bankTransferDetails.accountNumber}</p>
            <p><strong>Titular:</strong> {bankTransferDetails.accountHolder}</p>
            <p><strong>C.I./NIT:</strong> {bankTransferDetails.identification}</p>
          </div>
        )}
      </div>

      {/* Common Footer Instructions */}
      <div className="p-4 bg-yellow-50 border-t text-yellow-800 text-sm">
        <p className="font-bold">¡Importante!</p>
        <p>Luego de realizar el pago, no olvides adjuntar tu comprobante en la sección correspondiente para que podamos procesar tu pedido.</p>
        <p className='mt-2'>
            En caso de inconvenientes:
            <a 
                href="https://wa.me/59174822704" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-green-600 hover:text-green-700 font-semibold ml-1 inline-flex items-center"
            >
                <FaWhatsapp className="inline-block mr-1" /> Contactar por WhatsApp
            </a>
        </p>
      </div>
    </div>
  );
};

export default PaymentInstructions;