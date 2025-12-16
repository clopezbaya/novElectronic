import React from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

const TermsAndConditionsPage: React.FC = () => {
  const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-10">
      <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-gray-200 pb-2 mb-4">{title}</h2>
      <div className="space-y-4 text-gray-700 leading-relaxed">
        {children}
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
            <Link 
                to="/" 
                className="inline-flex items-center text-gray-600 hover:text-gray-900 font-medium"
            >
                <FaArrowLeft className="mr-2" />
                Volver a la tienda
            </Link>
        </div>
        <div className="bg-white shadow-xl rounded-lg p-8 md:p-12">
          <h1 className="text-4xl font-bold text-center text-gray-900 mb-10">Términos y Condiciones</h1>
          
          <p className="mb-8 text-center text-gray-600">
            Bienvenido a NovElectronic. Al realizar una compra en nuestro sitio, aceptas los siguientes términos y condiciones. 
            Te pedimos que los leas atentamente.
          </p>

          <Section title="Política de Envíos">
            <p>
              Nos esforzamos por procesar y enviar tu pedido lo más rápido posible. Una vez que tu pago haya sido verificado y tu pedido marcado como "Pagado", procederemos con el envío.
            </p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>
                <strong>Envíos en Cochabamba y al Interior del País:</strong> El tiempo de entrega estimado es de <strong>48 a 72 horas hábiles</strong> una vez que el pedido ha sido despachado.
              </li>
              <li>
                <strong>Seguimiento de Pedido:</strong> Es responsabilidad del cliente estar atento al estado de su pedido, el cual se puede consultar en la sección "Mis Pedidos". Se proporcionará un comprobante de envío con los detalles de la empresa de transporte una vez que el estado cambie a "Enviado".
              </li>
            </ul>
          </Section>

          <Section title="Política de Cambios">
            <p>
              Aceptamos solicitudes de cambio únicamente para productos que presenten defectos de fábrica comprobables. El cliente tiene un plazo de 48 horas después de haber recibido el producto para reportar el defecto.
            </p>
            <ol className="list-decimal list-inside space-y-2 pl-4">
              <li>El producto no debe presentar signos de mal uso, caídas, roturas o manipulación de software.</li>
              <li>Debe ser devuelto con su empaque original, manuales y todos sus accesorios.</li>
              <li>Para iniciar un proceso de cambio, por favor, contacta a nuestro servicio de atención al cliente con tu número de pedido y evidencia del defecto.</li>
            </ol>
            <p className="mt-4 font-semibold">
              No se realizarán cambios por insatisfacción con el producto o si el cliente se equivocó de modelo al realizar la compra.
            </p>
          </Section>
          
          <Section title="Política de Reembolsos">
            <p>
              Solo se considerarán reembolsos en el caso excepcional de que no sea posible realizar el cambio por un producto idéntico o de similares características debido a falta de stock.
            </p>
            <p>
              No se realizarán reembolsos por otros motivos. Una vez procesado el pago y enviado el producto, la venta es final, sujeta únicamente a la política de cambios por defectos de fábrica.
            </p>
          </Section>

        </div>
      </div>
    </div>
  );
};

export default TermsAndConditionsPage;