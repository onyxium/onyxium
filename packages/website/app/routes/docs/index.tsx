import { Toolbar, Box, Link, Typography } from "@mui/material"
import { LoaderFunction } from "@remix-run/node"
import { useLoaderData } from "@remix-run/react"
import Header from "~/components/Header"
import { getBundles } from "~/utils/docs.server"
import { Link as RemixLink } from "@remix-run/react"
import { Layout } from "~/components/Layout"

export const loader: LoaderFunction = async () => {
	return await getBundles()
}

export default function Doc() {
	const docs = useLoaderData<
		{
			code: any
			frontmatter: Record<string, unknown>
			name: string
			slug: string
		}[]
	>()
	return (
		<Layout>
			<Typography variant="h4" component="h1">
				Documentation
			</Typography>
			{docs.map((doc) => (
				<Link component={RemixLink} to={`/docs/${doc.slug}`} key={doc.slug}>
					{doc.name}
				</Link>
			))}
		</Layout>
	)
}
