/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    50: '#fdf8f2',
                    100: '#f5efe8',
                    200: '#e8d9c8',
                    300: '#d4b896',
                    400: '#b8916a',
                    500: '#9a7356',
                    600: '#7c5a41',
                    700: '#5e4230',
                    800: '#3d2b1e',
                    900: '#2a1e14',
                }
            },
            fontFamily: {
                mono: ['Courier Prime', 'Courier New', 'Courier', 'monospace'],
                sans: ['"DM Sans"', 'sans-serif'],
            },
            colors: {
                gogon: {
                    bg: '#F5EFE8',
                    card: '#FFFFFF',
                    dark: '#1E1E1E',
                    text: '#2A241D',
                    muted: '#8C8476',
                    border: '#D4C8BC',
                }
            }
        },
    },
    plugins: [],
}
