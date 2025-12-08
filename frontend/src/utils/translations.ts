export const statusTranslations: { [key: string]: string } = {
  PENDING_PAYMENT: 'Pendiente de Pago',
  PENDING_VERIFICATION: 'Pendiente de Verificación',
  PAYMENT_REJECTED: 'Pago Rechazado',
  PAID: 'Pagado',
  ENVIADO: 'Enviado',
  DELIVERED: 'Entregado',
  CANCELED: 'Cancelado',
};

export const getTranslatedStatus = (status: string): string => {
  return statusTranslations[status] || status;
};
