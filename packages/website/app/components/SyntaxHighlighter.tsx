import SyntaxHighlighter from "react-syntax-highlighter"
import atomDark from "react-syntax-highlighter/dist/cjs/styles/hljs/atom-one-dark"

export const Highlighter = ({
	children,
	lang,
	lineNumbers = true,
}: {
	lang: string | undefined
	children: string
	lineNumbers?: boolean
}) => (
	<SyntaxHighlighter
		codeTagProps={{
			style: {
				fontFamily: "'Roboto Mono', monospace",
			},
		}}
		language={lang}
		// @ts-ignore
		style={atomDark}
		showLineNumbers={lineNumbers}
	>
		{children}
	</SyntaxHighlighter>
)
