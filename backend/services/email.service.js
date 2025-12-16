const sgMail = require('@sendgrid/mail');
const getWelcomeTemplate = require('./email_templates/welcomeTemplate');
const getOrderConfirmationTemplate = require('./email_templates/orderConfirmationTemplate');
const getStatusUpdateTemplate = require('./email_templates/statusUpdateTemplate');
const getPaymentVerifiedTemplate = require('./email_templates/paymentVerifiedTemplate'); // New import
const getOrderShippedTemplate = require('./email_templates/orderShippedTemplate'); // New import

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const EMAIL_FROM = process.env.EMAIL_FROM || 'test@example.com';
const LOGO_URL = process.env.LOGO_URL || 'https://novelectronic-client.onrender.com/assets/logo1-owTSMnYn.png';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const sendWelcomeEmail = async (userEmail, userName) => {
  const loginUrl = `${FRONTEND_URL}/login`;
  const htmlContent = getWelcomeTemplate(userName, loginUrl, LOGO_URL);

  const msg = {
    to: userEmail,
    from: EMAIL_FROM,
    subject: '¡Bienvenido a NovElectronic!',
    html: htmlContent,
  };
  try {
    await sgMail.send(msg);
    console.log(`Email de bienvenida enviado a ${userEmail}`);
  } catch (error) {
    console.error(`Error enviando email de bienvenida a ${userEmail}:`, error);
    if (error.response) {
      console.error(error.response.body);
    }
    throw error;
  }
};

const sendOrderConfirmationEmail = async (order) => {
  const myOrdersUrl = `${FRONTEND_URL}/my-orders`;
  const htmlContent = getOrderConfirmationTemplate(order, myOrdersUrl, LOGO_URL);

  const msg = {
    to: order.userEmail,
    from: EMAIL_FROM,
    subject: `Confirmación de Pedido #${order.orderNumber} - NovElectronic`, // Use orderNumber
    html: htmlContent,
  };
  try {
    await sgMail.send(msg);
    console.log(`Email de confirmación de pedido #${order.orderNumber} enviado a ${order.userEmail}`);
  } catch (error) {
    console.error(`Error enviando email de confirmación de pedido #${order.orderNumber} a ${order.userEmail}:`, error);
    if (error.response) {
      console.error(error.response.body);
    }
    throw error;
  }
};

// New email function for payment verified
const sendPaymentVerifiedEmail = async (order) => {
  const myOrdersUrl = `${FRONTEND_URL}/my-orders`;
  const htmlContent = getPaymentVerifiedTemplate(order, myOrdersUrl, LOGO_URL);

  const msg = {
    to: order.userEmail,
    from: EMAIL_FROM,
    subject: `¡Pago Verificado para Pedido #${order.orderNumber} - NovElectronic!`,
    html: htmlContent,
  };
  try {
    await sgMail.send(msg);
    console.log(`Email de pago verificado para pedido #${order.orderNumber} enviado a ${order.userEmail}`);
  } catch (error) {
    console.error(`Error enviando email de pago verificado para pedido #${order.orderNumber} a ${order.userEmail}:`, error);
    if (error.response) {
      console.error(error.response.body);
    }
    throw error;
  }
};

// New email function for order shipped
const sendOrderShippedEmail = async (order) => {
  const myOrdersUrl = `${FRONTEND_URL}/my-orders`;
  const htmlContent = getOrderShippedTemplate(order, myOrdersUrl, LOGO_URL);

  const msg = {
    to: order.userEmail,
    from: EMAIL_FROM,
    subject: `¡Tu Pedido #${order.orderNumber} ha sido Enviado! - NovElectronic`,
    html: htmlContent,
  };
  try {
    await sgMail.send(msg);
    console.log(`Email de pedido enviado para pedido #${order.orderNumber} enviado a ${order.userEmail}`);
  } catch (error) {
    console.error(`Error enviando email de pedido enviado para pedido #${order.orderNumber} a ${order.userEmail}:`, error);
    if (error.response) {
      console.error(error.response.body);
    }
    throw error;
  }
};

const sendOrderStatusUpdateEmail = async (order) => {
  const myOrdersUrl = `${FRONTEND_URL}/my-orders`;
  const htmlContent = getStatusUpdateTemplate(order, myOrdersUrl, LOGO_URL);

  const msg = {
    to: order.userEmail,
    from: EMAIL_FROM,
    subject: `Actualización de Estado de Pedido #${order.orderNumber} - NovElectronic`, // Use orderNumber
    html: htmlContent,
  };
  try {
    await sgMail.send(msg);
    console.log(`Email de actualización de estado de pedido #${order.orderNumber} enviado a ${order.userEmail}`);
  } catch (error) {
    console.error(`Error enviando email de actualización de estado de pedido #${order.orderNumber} a ${order.userEmail}:`, error);
    if (error.response) {
      console.error(error.response.body);
    }
    throw error;
  }
};

module.exports = {
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendPaymentVerifiedEmail, // New export
  sendOrderShippedEmail, // New export
  sendOrderStatusUpdateEmail,
};
