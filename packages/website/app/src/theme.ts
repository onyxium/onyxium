import { createTheme, PaletteOptions } from "@mui/material"

// TODO: light mode possibly?

const darkPalette = {
	primary: {
		main: "#C63091",
	},
	secondary: {
		main: "#6C00D9",
	},
	background: {
		default: "#1B1F24",
		paper: "#2A2C30",
	},
} as PaletteOptions

const theme = createTheme({
	palette: {
		...darkPalette,
		mode: "dark",
	},
})

export default theme
