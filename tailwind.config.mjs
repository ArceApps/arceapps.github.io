/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	darkMode: 'class',
	theme: {
		extend: {
			colors: {
				primary: '#8B5CF6', // Violet 500
				secondary: '#EC4899', // Pink 500
				accent: '#06B6D4', // Cyan 500
				dark: {
					900: '#0F172A', // Slate 900
					800: '#1E293B', // Slate 800
					700: '#334155', // Slate 700
				}
			},
			fontFamily: {
				sans: ['Outfit', 'Inter', 'sans-serif'],
				heading: ['Outfit', 'sans-serif'],
			},
			animation: {
				'fade-in': 'fadeIn 0.5s ease-out',
				'slide-up': 'slideUp 0.5s ease-out',
				'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
			},
			keyframes: {
				fadeIn: {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' },
				},
				slideUp: {
					'0%': { transform: 'translateY(20px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' },
				},
			},
		},
	},
	plugins: [],
}
