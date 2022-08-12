import { Link as RemixLink, useLocation } from "@remix-run/react"
import { AppBar, Box, IconButton, Button, Toolbar, colors } from "@mui/material"
import { MenuOutlined as MenuIcon } from "@mui/icons-material"
import React from "react"
import { DocsBreadcrumbs, drawerWidth, useWillShowDrawer } from "./DocsLayout"

const PageButton = ({
	label,
	color,
	to,
}: {
	label: string
	color: boolean
	to: string
}) => (
	<Button
		component={RemixLink}
		to={to}
		sx={{
			color: color ? "#EC47B3" : colors.blueGrey[200],
		}}
		variant="text"
	>
		{label}
	</Button>
)

export default function Header({
	setDrawerOpen,
}: {
	setDrawerOpen?: React.Dispatch<React.SetStateAction<boolean>>
}) {
	const location = useLocation()
	const isDocs = location.pathname.includes("/docs")
	const isApiDocs = location.pathname.includes("/api-docs")
	const isMain = !isDocs && !isApiDocs
	const willShowDrawer = useWillShowDrawer()
	return (
		<AppBar
			position="fixed"
			sx={{
				width: { xs: "100%", md: `calc(100% - ${drawerWidth}px)` },
				ml: { xs: 0, md: `${drawerWidth}px` },
				// zIndex: (theme) => theme.zIndex.drawer + 1,
				backgroundColor: "transparent",
				backgroundImage: "none",
				shadow: "none",
				boxShadow: "none",
				borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
			}}
		>
			<Box sx={{ px: willShowDrawer ? 4 : 2 }}>
				<Toolbar disableGutters>
					{setDrawerOpen && (
						<IconButton
							color="inherit"
							sx={{ display: { xs: "inline-flex", md: "none" }, mr: 1 }}
							onClick={() => setDrawerOpen((prev) => !prev)}
						>
							<MenuIcon color="inherit" />
						</IconButton>
					)}
					{!isMain && <DocsBreadcrumbs />}
					<Box
						sx={{
							ml: "auto",
						}}
					>
						<PageButton to="/docs" label="Docs" color={isDocs} />
						<PageButton to="/api-docs" label="API" color={isApiDocs} />
					</Box>
				</Toolbar>
			</Box>
		</AppBar>
	)
}
