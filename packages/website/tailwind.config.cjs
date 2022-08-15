const defaultTheme = require("tailwindcss/defaultTheme")

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
	theme: {
		fontFamily: {
			sans: ["InterVariable", ...defaultTheme.fontFamily.sans],
			mono: ['"Source Code ProVariable"', ...defaultTheme.fontFamily.mono],
		},
		extend: {
			colors: {
				paper: "#2A2C30",
				primary: "#6C00D9",
				"primary-contrast": "#D0A0FF",
				secondary: "#C63091",
			},
		},
	},
	plugins: [],
}
