/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./src/**/*.{js,jsx,ts,tsx}'],
    theme: {
        extend: {
        colors: {
          secondary: '#06A1D5',
        },
    },
    },
    plugins: [require('@tailwindcss/aspect-ratio')],
};
