import {
	ApiFunction,
	ApiItem,
	ApiModel,
	ApiPackage,
} from "@microsoft/api-extractor-model"
import { readdirSync } from "node:fs"
import { join } from "node:path"
import type * as tsdoc from "@microsoft/tsdoc"
import type { DeclarationReference } from "@microsoft/tsdoc/lib-commonjs/beta/DeclarationReference"

export const createModel = () => {
	const model = new ApiModel()
	const basePath = join(process.cwd(), "src", "apis")
	readdirSync(basePath).forEach((file) => {
		const filePath = join(basePath, file)
		model.loadPackage(filePath)
	})
	return model
}

export const model = createModel()

type ResolveDeclarationReference = (
	docDeclarationReference: tsdoc.DocDeclarationReference | DeclarationReference
) => { url?: string; text?: string }

export function createResolveDeclarationReference(contextApiItem: ApiItem) {
	const hierarchy = contextApiItem.getHierarchy()
	const apiModel = hierarchy[0] as ApiModel
	const apiPackage = hierarchy[1] as ApiPackage

	return (
		declarationReference: tsdoc.DocDeclarationReference | DeclarationReference
	) => {
		const result = apiModel.resolveDeclarationReference(
			declarationReference,
			contextApiItem
		)

		if (result.resolvedApiItem) {
			return {
				url: `/api-reference/${encodeURIComponent(apiPackage.name)}/${
					result.resolvedApiItem.kind
				}/${encodeURIComponent(result.resolvedApiItem.displayName)}`,
				text: result.resolvedApiItem.displayName,
			}
		}

		return {
			url: undefined,
			text: undefined,
		}
	}
}

export function tsdocNodeContainerToMarkdown(
	docNodeContainer: tsdoc.DocNodeContainer,
	resolveDeclarationReference?: ResolveDeclarationReference
) {
	let out = ""
	for (const node of docNodeContainer.nodes) {
		out += tsdocNodeToMarkdown(node, resolveDeclarationReference)
	}
	return out
}

export function tsdocNodeToMarkdown(
	docNode: tsdoc.DocNode,
	resolveDeclarationReference?: ResolveDeclarationReference
):
	| string
	| { kind: "CodeSpan"; code: string }
	| { kind: "FencedCode"; language?: string; code: string }
	| { kind: "LinkTag"; linkUrl: string; linkText: string } {
	switch (docNode.kind) {
		case "CodeSpan":
			return { kind: "CodeSpan", code: (docNode as tsdoc.DocCodeSpan).code }
		case "ErrorText":
			return (docNode as tsdoc.DocErrorText).text
		case "EscapedText":
			return (docNode as tsdoc.DocEscapedText).decodedText
		case "FencedCode":
			const docFencedCode = docNode as tsdoc.DocFencedCode
			return {
				kind: "FencedCode",
				language: docFencedCode.language ?? "",
				code: docFencedCode.code,
			}
		case "LinkTag":
			const docLinkTag = docNode as tsdoc.DocLinkTag

			let linkText: string = "unknown"
			let linkUrl: string = "about:blank"

			if (docLinkTag.codeDestination) {
				linkText =
					docLinkTag.linkText ??
					`${docLinkTag.codeDestination.memberReferences
						.map((v) => v.memberIdentifier?.identifier)
						.join(",")}`

				if (resolveDeclarationReference) {
					const { url, text } = resolveDeclarationReference(
						docLinkTag.codeDestination
					)
					if (url) linkUrl = url
					if (text && !docLinkTag.linkText) linkText = text
				}
			} else if (docLinkTag.urlDestination) {
				linkUrl = docLinkTag.urlDestination
				linkText = docLinkTag.linkText ?? linkUrl
			}

			return { kind: "LinkTag", linkText, linkUrl }
		case "Paragraph":
			return `\n\n${tsdocNodeContainerToMarkdown(
				docNode as tsdoc.DocParagraph,
				resolveDeclarationReference
			)}\n\n`
		case "PlainText":
			return (docNode as tsdoc.DocPlainText).text
		case "SoftBreak":
			return " "
	}

	return `\\<${docNode.kind}>`
}

export const recursiveGetMembers = (
	apiItem: ApiItem,
	members: ApiItem[] = []
): ApiItem[] => {
	if (apiItem.members) {
		apiItem.members.forEach((member) => {
			members.push(member)
			recursiveGetMembers(member, members)
		})
	}
	return members
}

export const generateInfo = async () => {
	const data = [] as ApiData[]
	for (const pkg of model.packages) {
		for (const entryPoint of pkg.entryPoints) {
			const summary =
				pkg.tsdocComment &&
				tsdocNodeContainerToMarkdown(pkg.tsdocComment.summarySection)
			data.push({
				name: pkg.displayName,
				members: await Promise.all(
					recursiveGetMembers(entryPoint).map(async (member) => {
						const tsdoc =
							"tsdocComment" in member
								? (member as unknown as { tsdocComment: tsdoc.DocComment })
										.tsdocComment
								: undefined
						const resolveDeclarationReference =
							createResolveDeclarationReference(member)
						return {
							name: member.displayName,
							kind: member.kind,
							summary:
								tsdoc?.summarySection &&
								tsdocNodeContainerToMarkdown(
									tsdoc.summarySection,
									resolveDeclarationReference
								),
							remarks:
								tsdoc?.remarksBlock &&
								tsdocNodeToMarkdown(
									tsdoc.remarksBlock,
									resolveDeclarationReference
								),
							modifiers:
								tsdoc?.modifierTagSet &&
								tsdoc.modifierTagSet.nodes.map((v) => v.tagName),
							returnType:
								tsdoc?.returnsBlock &&
								tsdocNodeToMarkdown(
									tsdoc.returnsBlock,
									resolveDeclarationReference
								),
							parameters:
								"parameters" in member
									? await Promise.all(
											(member as ApiFunction).parameters.map(
												async (parameter) => ({
													name: parameter.name,
													isOptional: parameter.isOptional,
													type: parameter.parameterTypeExcerpt.text,
													summary: parameter.tsdocParamBlock
														? tsdocNodeContainerToMarkdown(
																parameter.tsdocParamBlock.content,
																resolveDeclarationReference
														  )
														: "No Description",
												})
											)
									  )
									: undefined,
						}
					})
				),
				summary,
			})
		}
	}
	return data
}

export const getKinds = (pkg: ApiPackage) => {
	const kinds = new Set<string>()
	for (const entryPoint of pkg.entryPoints) {
		for (const member of recursiveGetMembers(entryPoint)) {
			kinds.add(member.kind)
		}
	}
	return Array.from(kinds)
}

export type ApiData = {
	name: string
	summary?: string
	members: {
		kind: ApiItem["kind"]
		name: string
		signature?: string
		summary?: Record<string, unknown> | string
		remarks?: Record<string, unknown> | string
		modifiers?: string[]
		returnType?: Record<string, unknown> | string
		parameters?: {
			name: string
			type: string
			summary?: string | Record<string, unknown>
		}[]
	}[]
}
