/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'cyber-dark': {
                    DEFAULT: '#0D1B2A',
                    card: '#16213E',
                    accent: '#3A86FF',
                    amber: '#FFBE0B',
                    red: '#EF233C',
                    green: '#06D6A0',
                },
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
