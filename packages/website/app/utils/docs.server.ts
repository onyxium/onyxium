import { readdirSync, readFileSync } from "fs"
import { bundleMDX } from "mdx-bundler"
import { join } from "path"
import { cwd } from "process"
import { json } from "remix"

export async function getBundles() {
	const files = readdirSync(join(cwd(), "app", "docs")).filter(
		(file) => file.endsWith(".md") || file.endsWith(".mdx")
	)
	const sources = files.map((file) => ({
		source: readFileSync(join(cwd(), "app", "docs", file)).toString(),
		file,
	}))
	const contents = await Promise.all(
		sources.map(async ({ source, file }) => ({
			mdx: await bundleMDX({ source }),
			slug: file.replace(/\.mdx?$/, ""),
		}))
	)
	return json(
		contents.map((content) => {
			return {
				frontmatter: content.mdx.frontmatter,
				code: content.mdx.code,
				name: content.mdx.frontmatter.title ?? content.slug,
				slug: content.slug,
			}
		})
	)
}

export async function getBundle(doc: string) {
	const files = readdirSync(join(cwd(), "app", "docs")).filter(
		(file) => file.endsWith(".md") || file.endsWith(".mdx")
	)
	const file = files.find(
		(file) => file.endsWith(`${doc}.md`) || file.endsWith(`${doc}.mdx`)
	)
	if (!file) {
		throw new Response("Not found", { status: 404 })
	}
	const source = readFileSync(join(cwd(), "app", "docs", file)).toString()
	const content = await bundleMDX({
		source,
	})
	return json({
		frontmatter: content.frontmatter,
		code: content.code,
	})
}
