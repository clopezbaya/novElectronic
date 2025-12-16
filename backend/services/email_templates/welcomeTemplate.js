// backend/services/email_templates/welcomeTemplate.js

const getWelcomeTemplate = (userName, loginUrl, logoUrl) => `
  <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4; padding: 20px 0; color: #333; line-height: 1.6;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
      <tr>
        <td style="padding: 20px; text-align: center; background-color: #0d1a26;">
          <img src="${logoUrl}" alt="NovElectronic Logo" style="max-width: 150px; height: auto;">
        </td>
      </tr>
      <tr>
        <td style="padding: 20px 40px; text-align: center;">
          <h1 style="color: #0056b3; font-size: 28px; margin-bottom: 20px;">¡Bienvenido a NovElectronic, ${userName}!</h1>
          <p style="font-size: 16px; margin-bottom: 20px;">
            Gracias por registrarte en nuestra tienda. Estamos muy emocionados de tenerte en nuestra comunidad.
          </p>
          <p style="font-size: 16px; margin-bottom: 30px;">
            Ahora puedes explorar un mundo de productos electrónicos de alta calidad.
          </p>
          <a href="${loginUrl}" style="background-color: #0056b3; color: #ffffff; padding: 12px 25px; border-radius: 5px; text-decoration: none; font-weight: bold; font-size: 16px;">
            Iniciar Sesión
          </a>
          <p style="font-size: 14px; color: #777; margin-top: 30px;">
            Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.
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

module.exports = getWelcomeTemplate;
