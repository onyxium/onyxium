import { Toolbar, Box } from "@mui/material"
import { LoaderFunction, MetaFunction } from "@remix-run/node"
import { useLoaderData } from "@remix-run/react"
import { getMDXComponent } from "mdx-bundler/client"
import React from "react"
import DocsLayout from "~/components/DocsLayout"
import Header from "~/components/Header"
import { getBundle } from "~/utils/docs.server"
import { components } from "~/utils/markdown.client"

export const loader: LoaderFunction = async ({ params }) => {
	const { doc } = params
	return await getBundle(doc!)
}

export const meta: MetaFunction = ({ data }) => {
	const { frontmatter } = data
	return {
		title: frontmatter.title || "",
	}
}

export default function Doc() {
	const { frontmatter, code } = useLoaderData<{
		frontmatter: Record<string, unknown>
		code: string
	}>()
	const Component = React.useMemo(() => getMDXComponent(code), [code])
	return (
		<DocsLayout
			drawerChildren={
				<Box sx={{ paddingTop: "8px" }}>
					<Toolbar />
					Hallo!
				</Box>
			}
		>
			<Box sx={{ paddingTop: "8px", width: "100%" }}>
				<Component components={components} />
			</Box>
		</DocsLayout>
	)
}
