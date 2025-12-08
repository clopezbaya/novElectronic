/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./src/**/*.{js,jsx,ts,tsx}'],
    theme: {
        extend: {
            colors: {
                secondary: '#06A1D5',
                'google-blue': '#4285F4', // Google's official blue
            },
        },
    },
    plugins: [require('@tailwindcss/aspect-ratio')],
};
