import { ApiItem } from "@microsoft/api-extractor-model"
import {
	Typography,
	Accordion,
	AccordionSummary,
	AccordionDetails,
	List,
	ListItem,
	ListItemButton,
	ListItemText,
	Box,
} from "@mui/material"
import { useLoaderData, Link as RemixLink } from "@remix-run/react"
import {
	membersToObject,
	KindToDisplayName,
	CreateRoutePath,
} from "~/components/DocsLayout"
import { ExpandMoreOutlined as ExpandMoreIcon } from "@mui/icons-material"
import { json, type LoaderFunction } from "@remix-run/node"
import { Layout } from "~/components/Layout"
import { ApiData, generateInfo } from "~/utils/api.server"

export const loader: LoaderFunction = async () => {
	const info = generateInfo()
	console.dir(info, { depth: null })
	return json(info)
}

export default function Index() {
	const data = useLoaderData<ApiData[]>()

	return (
		<Layout>
			{data.map(({ name: pkgName, members, summary }) => {
				return (
					<Box
						key={`${pkgName}`}
						sx={{ paddingBottom: (theme) => theme.spacing(2) }}
					>
						<Typography variant="h4" component="h1" gutterBottom>
							{pkgName}
						</Typography>
						{summary && (
							<Typography variant="h6" component="h2" gutterBottom>
								{summary}
							</Typography>
						)}
						{Object.entries(membersToObject(members)).map(([kind, names]) => {
							return (
								<Accordion
									elevation={1}
									sx={{ width: "100%" }}
									disableGutters
									key={`${pkgName}-${kind}`}
								>
									<AccordionSummary expandIcon={<ExpandMoreIcon />}>
										<Typography variant="subtitle2">
											{KindToDisplayName[kind as ApiItem["kind"]]}
										</Typography>
									</AccordionSummary>
									<AccordionDetails>
										<List disablePadding>
											{names.map((name) => (
												<ListItem
													disablePadding
													disableGutters
													key={`${kind}-${name}`}
												>
													<ListItemButton
														component={RemixLink}
														to={CreateRoutePath(pkgName, kind, name)}
													>
														<ListItemText>{name}</ListItemText>
													</ListItemButton>
												</ListItem>
											))}
										</List>
									</AccordionDetails>
								</Accordion>
							)
						})}
					</Box>
				)
			})}
		</Layout>
	)
}
