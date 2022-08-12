import { Box, Toolbar } from "@mui/material"
import Header from "./Header"

export function Layout({ children }: React.PropsWithChildren<{}>) {
	return (
		<>
			<Header />
			<Toolbar />
			<Box sx={{ paddingTop: "8px", px: 2 }}>{children}</Box>
		</>
	)
}
