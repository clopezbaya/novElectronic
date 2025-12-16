// backend/services/email_templates/orderConfirmationTemplate.js

const getOrderConfirmationTemplate = (order, myOrdersUrl, logoUrl) => `
  <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4; padding: 20px 0; color: #333; line-height: 1.6;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
      <tr>
        <td style="padding: 20px; text-align: center; background-color: #0d1a26;">
          <img src="${logoUrl}" alt="NovElectronic Logo" style="max-width: 150px; height: auto;">
        </td>
      </tr>
      <tr>
        <td style="padding: 20px 40px; text-align: center;">
          <h1 style="color: #0056b3; font-size: 28px; margin-bottom: 20px;">¡Pedido Confirmado, ${order.userName || order.userEmail}!</h1>
          <p style="font-size: 16px; margin-bottom: 10px;">
            Hemos recibido tu pedido #${order.orderNumber}. ¡Gracias por tu compra!
          </p>
          <p style="font-size: 16px; margin-bottom: 20px;">
            Tu pedido está siendo procesado y te notificaremos cuando haya cambios en su estado.
          </p>
          
          <div style="text-align: left; margin: 30px 0; padding: 20px; border: 1px solid #eee; border-radius: 5px; background-color: #f9f9f9;">
            <h3 style="color: #0056b3; font-size: 20px; margin-top: 0; margin-bottom: 15px;">Resumen del Pedido #${order.orderNumber}</h3>
            <p style="margin-bottom: 5px;"><strong>Total:</strong> ${order.total} Bs</p>
            <ul style="list-style-type: none; padding: 0; margin-top: 15px; border-top: 1px solid #eee; padding-top: 15px;">
              ${order.orderItems.map(item => `
                <li style="margin-bottom: 15px; font-size: 15px; display: flex; align-items: center;">
                  <img src="${item.productImage}" alt="${item.productName}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; margin-right: 15px;">
                  <div style="flex-grow: 1;">
                    <span style="font-weight: bold;">${item.productName}</span> (x${item.quantity})
                  </div>
                  <div style="font-weight: bold;">
                    ${item.price * item.quantity} Bs
                  </div>
                </li>
              `).join('')}
            </ul>
          </div>

          <a href="${myOrdersUrl}" style="background-color: #0056b3; color: #ffffff; padding: 12px 25px; border-radius: 5px; text-decoration: none; font-weight: bold; font-size: 16px;">
            Ver mi Pedido
          </a>
          
          <p style="font-size: 14px; color: #777; margin-top: 30px;">
            Si tienes alguna pregunta, no dudes en <a href="mailto:clopezbaya@gmail.com" style="color: #0056b3; text-decoration: none;">contactarnos</a>.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding: 20px; text-align: center; background-color: #f0f0f0; border-top: 1px solid #e0e0e0;">
          <p style="font-size: 12px; color: #777;">&copy; ${new Date().getFullYear()} NovElectronic. Todos los derechos reservados.</p>
        </td>
      </tr>
    </table>
  </div>
`;

module.exports = getOrderConfirmationTemplate;
