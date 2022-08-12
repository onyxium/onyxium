import {
	Drawer,
	Toolbar,
	Box,
	AccordionSummary,
	Accordion,
	AccordionDetails,
	Divider,
	List,
	ListItem,
	ListItemButton,
	ListItemText,
	Typography,
	Breadcrumbs,
	IconButton,
	Link,
	useTheme,
	useMediaQuery,
} from "@mui/material"
import Header from "~/components/Header"
import React from "react"
import type { ApiItem } from "@microsoft/api-extractor-model"
import type { ApiData } from "~/utils/api.server"
import {
	ExpandMoreOutlined as ExpandMoreIcon,
	HomeOutlined as HomeIcon,
} from "@mui/icons-material"
import { Link as RemixLink, useLocation } from "@remix-run/react"

export const drawerWidth = 300

export const membersToObject = (members: ApiData["members"]) => {
	const result = {} as Record<ApiItem["kind"], string[]>
	members.forEach((member) => {
		if (!result[member.kind]) {
			result[member.kind] = []
		}
		result[member.kind].push(member.name)
	})
	return result
}

export const KindToDisplayName = {
	CallSignature: "Call Signatures",
	Class: "Classes",
	ConstructSignature: "Construct Signatures",
	Constructor: "Constructors",
	Enum: "Enums",
	EnumMember: "Enum Members",
	Function: "Functions",
	IndexSignature: "Index Signatures",
	Interface: "Interfaces",
	Method: "Methods",
	Module: "Modules",
	Property: "Properties",
	PropertySignature: "Property Signatures",
	TypeAlias: "Types",
	Variable: "Variables",
	None: "None",
	Namespace: "Namespaces",
	Model: "Models",
	EntryPoint: "Entry Points",
	Package: "Packages",
	MethodSignature: "Method Signatures",
} as Record<ApiItem["kind"], string>

export const CreateRoutePath = (pkg: string, kind: string, name: string) =>
	`/api-docs/${encodeURIComponent(pkg)}/${kind}/${encodeURIComponent(name)}`

export default function DocsLayout({
	children,
	drawerChildren,
	data,
}: {
	children: React.ReactNode
	drawerChildren?: React.ReactNode
	data?: ApiData[]
}) {
	const [drawerOpen, setDrawerOpen] = React.useState(false)
	const willShowDrawer = useWillShowDrawer()

	const dC = drawerChildren || (
		<Box sx={{ overflow: "auto" }}>
			{data!.map(({ name: pkgName, members }) => {
				return (
					<Accordion
						disableGutters
						key={pkgName}
						sx={{
							background: "none",
							boxShadow: "none",
						}}
					>
						<AccordionSummary
							expandIcon={<ExpandMoreIcon />}
							sx={{
								backgroundColor: "transparent",
							}}
						>
							<Typography variant="overline">{pkgName}</Typography>
						</AccordionSummary>
						<AccordionDetails>
							<List>
								{Object.entries(membersToObject(members)).map(
									([kind, names], index) => {
										return (
											<React.Fragment key={`${pkgName}-${kind}`}>
												{index > 0 && (
													<Divider sx={{ mb: (theme) => theme.spacing(1) }} />
												)}
												<ListItem disableGutters>
													<Typography variant="subtitle2" component="p">
														{KindToDisplayName[kind as ApiItem["kind"]]}
													</Typography>
												</ListItem>
												{names.map((name, i) => {
													return (
														<ListItem
															key={`${kind}-${name}-${i}`}
															disableGutters
															disablePadding
														>
															<ListItemButton
																component={RemixLink}
																to={CreateRoutePath(pkgName, kind, name)}
															>
																<ListItemText
																	primary={name}
																	sx={{ wordBreak: "break-all" }}
																/>
															</ListItemButton>
														</ListItem>
													)
												})}
											</React.Fragment>
										)
									}
								)}
							</List>
						</AccordionDetails>
					</Accordion>
				)
			})}
		</Box>
	)

	return (
		<>
			<Header setDrawerOpen={setDrawerOpen} />
			<Box sx={{ display: "flex", flexDirection: "row", minHeight: "100vh" }}>
				<Drawer
					variant="permanent"
					sx={{
						width: drawerWidth,
						flexShrink: 0,
						[`& .MuiDrawer-paper`]: {
							width: drawerWidth,
							boxSizing: "border-box",
						},
						display: { xs: "none", md: "block" },
					}}
				>
					<Toolbar>Onyxium</Toolbar>
					{dC}
				</Drawer>
				<Drawer
					variant="temporary"
					open={drawerOpen}
					onClose={() => setDrawerOpen(false)}
					ModalProps={{
						keepMounted: true,
					}}
					sx={{
						display: { xs: "block", md: "none" },
						"& .MuiDrawer-paper": {
							boxSizing: "border-box",
							width: drawerWidth,
						},
					}}
				>
					{dC}
				</Drawer>
				<Box
					sx={{
						paddingTop: "80px",
						px: willShowDrawer ? 4 : 2,
						width: "100%",
						minHeight: "100vh",
					}}
				>
					<Toolbar />
					{children}
				</Box>
			</Box>
		</>
	)
}

export function useWillShowDrawer() {
	const theme = useTheme()
	const will = useMediaQuery(theme.breakpoints.up("md"))
	return will
}

export function DocsBreadcrumbs() {
	const { pathname } = useLocation()
	const [_, pkgName, type, item] = pathname.replace("/api-docs", "").split("/")
	const packageName = pkgName ? decodeURIComponent(pkgName) : undefined
	const typeName = type ? KindToDisplayName[type as never] : undefined
	const itemName = item ? decodeURIComponent(item) : undefined
	const willShowDrawer = useWillShowDrawer()
	return (
		<Breadcrumbs separator="/" maxItems={willShowDrawer ? undefined : 2}>
			{/* @ts-ignore  */}
			<IconButton
				LinkComponent={RemixLink}
				to="/api-docs"
				color={!pkgName ? "default" : "inherit"}
			>
				<HomeIcon />
			</IconButton>
			{pkgName && (
				<Link
					underline="hover"
					color={!type ? "text.primary" : "inherit"}
					component={RemixLink}
					to={`/api-docs/${pkgName}`}
				>
					{packageName}
				</Link>
			)}
			{type && (
				<Link
					underline="hover"
					color={!item ? "text.primary" : "inherit"}
					component={RemixLink}
					to={`/api-docs/${pkgName}/${type}`}
				>
					{typeName}
				</Link>
			)}
			{item && (
				<Link
					underline="hover"
					color="text.primary"
					component={RemixLink}
					to={`/api-docs/${pkgName}/${type}/${item}`}
				>
					{itemName}
				</Link>
			)}
		</Breadcrumbs>
	)
}
