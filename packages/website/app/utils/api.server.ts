import {
	type ApiItem,
	ApiModel,
	ApiFunction,
	ApiPackage,
} from "@microsoft/api-extractor-model"
import type { DocComment, DocNode, DocPlainText } from "@microsoft/tsdoc"
import path from "node:path"
import fs from "node:fs"
import tsdoc from "@microsoft/tsdoc"
import type { DeclarationReference } from "@microsoft/tsdoc/lib-commonjs/beta/DeclarationReference"
import { CreateRoutePath } from "~/components/DocsLayout"

const recursiveGetMembers = (
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

const recursiveGetTextFromNode = (node: DocNode): string => {
	let text = ""
	if (node.kind === "PlainText") {
		text += (node as DocPlainText).text
	} else {
		node.getChildNodes().forEach((childNode) => {
			text += recursiveGetTextFromNode(childNode)
		})
	}
	return text
}

export const makeModel = () => {
	const model = new ApiModel()
	const basePath = path.join(process.cwd(), "app/apis")
	fs.readdirSync(basePath).forEach((file) => {
		const filePath = path.join(basePath, file)
		model.loadPackage(filePath)
	})
	return model
}

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
				url: CreateRoutePath(
					apiPackage.name,
					result.resolvedApiItem.kind,
					result.resolvedApiItem.displayName
				),
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
) {
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

export const generateInfo = async () => {
	const model = makeModel()
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
								? (member as unknown as { tsdocComment: DocComment })
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
