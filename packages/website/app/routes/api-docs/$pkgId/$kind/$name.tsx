import {
	Typography,
	colors,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	Alert,
	Link,
} from "@mui/material"
import { json, type LoaderFunction } from "@remix-run/node"
import { useLoaderData, Link as RemixLink } from "@remix-run/react"
import DocsLayout from "~/components/DocsLayout"
import { Highlighter } from "~/components/SyntaxHighlighter"
import { ApiData, generateInfo } from "~/utils/api.server"

export const loader: LoaderFunction = async ({ params }) => {
	const { pkgId, kind, name } = params
	const info = await generateInfo()
	console.log(info)
	const packageInfo = info.find((pkg) => pkg.name === pkgId)
	if (!packageInfo) {
		throw new Response("Not found", { status: 404 })
	}
	const member = packageInfo.members.filter(
		(member) => member.kind === kind && member.name === name
	)?.[0]
	if (!member) {
		throw new Response("Not found", { status: 404 })
	}
	return json({
		member,
		data: info,
	})
}

const DocTable = ({
	typeField,
	data,
}: {
	typeField: boolean
	data: NonNullable<ApiData["members"]["0"]["parameters"]>
}) => (
	<Table sx={{ maxWidth: "75%" }}>
		<TableHead>
			<TableRow>
				<TableCell
					align="left"
					sx={{
						pb: 1,
						fontSize: (theme) => theme.typography.body1.fontSize,
					}}
				>
					Name
				</TableCell>
				{typeField && (
					<TableCell
						align="left"
						sx={{
							pb: 1,
							fontSize: (theme) => theme.typography.body1.fontSize,
						}}
					>
						Type
					</TableCell>
				)}
				<TableCell
					align="left"
					sx={{
						pb: 1,
						fontSize: (theme) => theme.typography.body1.fontSize,
					}}
				>
					Description
				</TableCell>
			</TableRow>
		</TableHead>
		<TableBody>
			{data.map((row) => (
				<TableRow sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
					<TableCell align="left" sx={{ color: colors.blueGrey[100] }}>
						{row.name}
					</TableCell>
					{typeField && (
						<TableCell align="left" sx={{ color: colors.blueGrey[100] }}>
							{row.type}
						</TableCell>
					)}
					<TableCell align="left" sx={{ color: colors.blueGrey[100] }}>
						<DataToComponent data={row.summary ?? "No description"} />
					</TableCell>
				</TableRow>
			))}
		</TableBody>
	</Table>
)

const oxfordComma = (a: string[]) =>
	a.length > 1
		? `${a.slice(0, -1).join(", ")} and ${a.slice(-1)}`
		: { 0: "", 1: a[0] }[a.length]

export const DataToComponent = ({
	data,
}: {
	data: Record<string, unknown> | string
}) => {
	if (typeof data === "string") return <>{data}</>
	let Component: React.ReactElement = <></>

	switch (data.kind) {
		case "LinkTag":
			Component = (
				<Link component={RemixLink} to={data.linkUrl as string}>
					{data.linkText}
				</Link>
			)
			break
		case "FencedCode":
			Component = (
				<Highlighter lang={data.language as string}>
					{data.code as string}
				</Highlighter>
			)
			break
		case "CodeSpan":
			Component = (
				<code style={{ fontFamily: "'Roboto Mono', monospace" }}>
					{data.code}
				</code>
			)
	}

	return Component
}

export default function Name() {
	const { member, data } = useLoaderData<{
		member: ApiData["members"]["0"]
		data: ApiData[]
	}>()
	const memberInfo =
		member.modifiers
			?.filter((value) =>
				[
					"@alpha",
					"@beta",
					"@internal",
					"@deprecated",
					"@experimental",
				].includes(value)
			)
			.map((value) => value.replace("@", "")) ?? []
	return (
		<DocsLayout data={data}>
			{memberInfo.length > 0 && (
				<Alert
					severity="warning"
					sx={{
						mb: 2,
					}}
				>
					This item is {oxfordComma(memberInfo)}
				</Alert>
			)}
			<Typography
				variant="h4"
				sx={{
					fontWeight: "bold",
				}}
				component="h1"
				gutterBottom
			>
				{member.name}
			</Typography>
			{member.summary && (
				<Typography
					variant="h5"
					sx={{
						color: colors.blueGrey[200],
					}}
					paragraph
					gutterBottom
				>
					<DataToComponent data={member.summary} />
				</Typography>
			)}
			{member.parameters && (
				<>
					<Typography variant="h5" sx={{ mt: 8 }} component="h2">
						Parameters
					</Typography>
					<DocTable typeField={true} data={member.parameters} />
				</>
			)}
			{member.returnType && (
				<>
					<Typography variant="h5" sx={{ mt: 8 }} component="h2">
						Return Type
					</Typography>
					<Typography
						variant="body1"
						sx={{ color: colors.blueGrey[200] }}
						paragraph
						gutterBottom
					>
						{member.returnType}
					</Typography>
				</>
			)}
			{member.remarks && (
				<>
					<Typography variant="h5" sx={{ mt: 8 }} component="h2">
						Remarks
					</Typography>
					<Typography
						variant="body1"
						sx={{
							color: colors.blueGrey[200],
						}}
						paragraph
						gutterBottom
					>
						<DataToComponent data={member.remarks} />
					</Typography>
				</>
			)}
		</DocsLayout>
	)
}
