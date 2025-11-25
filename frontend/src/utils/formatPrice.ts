// frontend/src/utils/formatPrice.ts

/**
 * Formats a numeric price into a localized currency string.
 * @param {number} price The price as a number.
 * @param {string} currencySymbol The currency symbol (e.g., "Bs", "$").
 * @param {string} locale The locale to use for formatting (e.g., "es-BO" for Bolivia).
 * @returns {string} The formatted price string (e.g., "Bs. 1.234,56").
 */
export const formatPrice = (
    price: number,
    currencySymbol: string = 'Bs',
    locale: string = 'es-BO'
): string => {
    // Usar Intl.NumberFormat con la localización deseada
    const formatter = new Intl.NumberFormat(locale, {
        style: 'decimal', // 'decimal' o 'currency'
        minimumFractionDigits: 2, // siempre 2 decimales
        maximumFractionDigits: 2,
    });

    const formattedNumber = formatter.format(price); // Aplica separadores de miles y decimales
    return `${currencySymbol} ${formattedNumber}`;
};
