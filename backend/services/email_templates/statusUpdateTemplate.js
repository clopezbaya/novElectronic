// backend/services/email_templates/statusUpdateTemplate.js

const getStatusUpdateTemplate = (order, myOrdersUrl, logoUrl) => `
  <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4; padding: 20px 0; color: #333; line-height: 1.6;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
      <tr>
        <td style="padding: 20px; text-align: center; background-color: #0d1a26;">
          <img src="${logoUrl}" alt="NovElectronic Logo" style="max-width: 150px; height: auto;">
        </td>
      </tr>
      <tr>
        <td style="padding: 20px 40px; text-align: center;">
          <h1 style="color: #0056b3; font-size: 28px; margin-bottom: 20px;">¡Tu Pedido #${order.orderNumber} ha sido Actualizado!</h1>
          <p style="font-size: 16px; margin-bottom: 20px;">
            Hola ${order.userName || order.userEmail},
          </p>
          <p style="font-size: 16px; margin-bottom: 30px;">
            El estado de tu pedido #${order.orderNumber} ha cambiado a:
            <br><strong style="color: #28a745; font-size: 20px;">${order.status}</strong>
          </p>
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

module.exports = getStatusUpdateTemplate;
