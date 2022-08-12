import {
	Link,
	Typography,
	Button,
	TableRow,
	TableCell,
	TableHead,
	TableFooter,
	TableBody,
	Table,
	Paper,
	Box,
} from "@mui/material"
import { Link as RemixLink } from "@remix-run/react"
import { MDXContentProps } from "mdx-bundler/client"
import SyntaxHighlighter from "react-syntax-highlighter"
import atomDark from "react-syntax-highlighter/dist/cjs/styles/hljs/atom-one-dark"
import { Highlighter } from "~/components/SyntaxHighlighter"

const LinkC = ({ children, ...props }: React.PropsWithChildren<any>) => (
	<Link {...props} component={RemixLink} to={props.href}>
		{children}
	</Link>
)

const Blockquote = ({ children }: React.PropsWithChildren<{}>) => {
	return (
		<Paper
			sx={{
				padding: (theme) => theme.spacing(2),
				backgroundColor: (theme) => theme.palette.background.paper,
				borderLeft: (theme) => `4px solid ${theme.palette.info.main}`,
			}}
		>
			{children}
		</Paper>
	)
}

export const components: MDXContentProps["components"] = {
	// @ts-ignore
	a: LinkC,
	// @ts-ignore
	blockquote: Blockquote,
	// @ts-ignore
	button: Button,
	code: (props) => {
		// @ts-ignore
		return <Highlighter lang={props.className?.replace("language-", "")} />
	},
	// code: {
	// 	component: "code",
	// 	props: {
	// 		style: {
	// 			backgroundColor: inlineCodeBgColor,
	// 			borderRadius: "4px",
	// 			color: inlineCodeColor,
	// 			margin: "0 0.2rem",
	// 			padding: "0.5rem 0.5rem",
	// 		} as React.CSSProperties,
	// 	},
	// },
	h1: (props) => {
		// @ts-ignore
		return <Typography {...props} variant="h1" gutterBottom />
	},
	h2: (props) => {
		// @ts-ignore
		return <Typography {...props} variant="h2" gutterBottom />
	},
	h3: (props) => {
		// @ts-ignore
		return <Typography {...props} variant="h2" gutterBottom />
	},
	h4: (props) => {
		// @ts-ignore
		return <Typography {...props} variant="h2" gutterBottom />
	},
	h5: (props) => {
		// @ts-ignore
		return <Typography {...props} variant="h2" gutterBottom />
	},
	h6: (props) => {
		// @ts-ignore
		return <Typography {...props} variant="h2" gutterBottom />
	},
	Link: LinkC,
	p: (props) => {
		// @ts-ignore
		return <Typography {...props} gutterBottom variant="body1" />
	},
	pre: (props) => {
		return (
			<Box
				sx={{
					whiteSpace: "pre-wrap",
				}}
			>
				{props.children}
			</Box>
		)
	},
	// pre: {
	// 	component: PreBlock,
	// 	props: { theme: codeBlockTheme } as PreBlockProps,
	// },
	// @ts-ignore
	table: Table,
	// @ts-ignore
	tbody: TableBody,
	// @ts-ignore
	td: TableCell,
	// @ts-ignore
	tfoot: TableFooter,
	// @ts-ignore
	thead: TableHead,
	// @ts-ignore
	th: TableCell,
	// @ts-ignore
	tr: TableRow,
}
