import * as React from "react"
import {
	Links,
	LiveReload,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from "@remix-run/react"
import { withEmotionCache } from "@emotion/react"
import { unstable_useEnhancedEffect as useEnhancedEffect } from "@mui/material"
import theme from "./src/theme"
import ClientStyleContext from "./src/ClientStyleContext"

interface DocumentProps {
	children: React.ReactNode
	title?: string
}

const Document = withEmotionCache(
	({ children, title }: DocumentProps, emotionCache) => {
		const clientStyleData = React.useContext(ClientStyleContext)

		// Only executed on client
		useEnhancedEffect(() => {
			// re-link sheet container
			emotionCache.sheet.container = document.head
			// re-inject tags
			const tags = emotionCache.sheet.tags
			emotionCache.sheet.flush()
			tags.forEach((tag) => {
				// eslint-disable-next-line no-underscore-dangle
				;(emotionCache.sheet as any)._insertTag(tag)
			})
			// reset cache to reapply global styles
			clientStyleData.reset()
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [])

		return (
			<html lang="en">
				<head>
					<meta charSet="utf-8" />
					<meta name="viewport" content="width=device-width,initial-scale=1" />
					<meta name="theme-color" content={theme.palette.primary.main} />
					{title ? <title>{title}</title> : null}
					<Meta />
					<Links />
					<link rel="preconnect" href="https://fonts.googleapis.com" />
					<link
						rel="preconnect"
						href="https://fonts.gstatic.com"
						crossOrigin="true"
					/>
					<link
						href="https://fonts.googleapis.com/css2?family=Roboto+Mono&display=swap"
						rel="stylesheet"
					/>
					<link
						rel="stylesheet"
						href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap"
					/>
					<meta
						name="emotion-insertion-point"
						content="emotion-insertion-point"
					/>
				</head>
				<body>
					{children}
					<ScrollRestoration />
					<Scripts />
					<LiveReload />
				</body>
			</html>
		)
	}
)

export default function App() {
	return (
		<Document>
			<Outlet />
		</Document>
	)
}
