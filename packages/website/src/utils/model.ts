import {
  ApiEntryPoint,
  ApiFunction,
  ApiItem,
  ApiModel,
  ApiPackage,
  ApiTypeAlias,
  ApiVariable,
} from "@microsoft/api-extractor-model"
import { readdirSync } from "node:fs"
import { join } from "node:path"
import type * as tsdoc from "@microsoft/tsdoc"
import type { DeclarationReference } from "@microsoft/tsdoc/lib-commonjs/beta/DeclarationReference"
import slugify from "slugify"

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
        url: `/api-reference/${slugify(apiPackage.name)}/${slugify(
          result.resolvedApiItem.kind
        )}/${slugify(result.resolvedApiItem.displayName)}`,
        text: result.resolvedApiItem.displayName,
      }
    }

    return {
      url: undefined,
      text: undefined,
    }
  }
}

export function tsdocNodeContainerToData(
  docNodeContainer: tsdoc.DocNodeContainer,
  resolveDeclarationReference?: ResolveDeclarationReference
) {
  let out: ReturnType<typeof tsdocNodeToData>[] = []
  for (const node of docNodeContainer.nodes) {
    const data = tsdocNodeToData(node, resolveDeclarationReference)
    out.push(...(Array.isArray(data) ? data : [data]))
  }
  return out
}

export type NodeToData =
  | string
  | { kind: "CodeSpan"; code: string }
  | { kind: "FencedCode"; language?: string; code: string }
  | { kind: "LinkTag"; linkUrl: string; linkText: string }

export function tsdocNodeToData(
  docNode: tsdoc.DocNode,
  resolveDeclarationReference?: ResolveDeclarationReference
): NodeToData | NodeToData[] {
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
      const data = tsdocNodeContainerToData(
        docNode as tsdoc.DocParagraph,
        resolveDeclarationReference
      )
      const arrayData = Array.isArray(data) ? (data as NodeToData[]) : [data]
      return ["\n\n", ...arrayData, "\n\n"]
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

export const makeDataForPackage = async (
  pkg: ApiPackage,
  entryPoint: ApiEntryPoint
) => {
  const summary =
    pkg.tsdocComment &&
    tsdocNodeContainerToData(pkg.tsdocComment.summarySection)
  return {
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
            tsdocNodeContainerToData(
              tsdoc.summarySection,
              resolveDeclarationReference
            ),
          remarks:
            tsdoc?.remarksBlock &&
            tsdocNodeToData(tsdoc.remarksBlock, resolveDeclarationReference),
          modifiers:
            tsdoc?.modifierTagSet &&
            tsdoc.modifierTagSet.nodes.map((v) => v.tagName),
          type:
            "typeExcerpt" in member
              ? (member as ApiTypeAlias).typeExcerpt.text
              : "variableTypeExcerpt" in member
              ? (member as ApiVariable).variableTypeExcerpt.text
              : tsdoc?.returnsBlock &&
                tsdocNodeToData(
                  tsdoc.returnsBlock,
                  resolveDeclarationReference
                ),
          parameters:
            "parameters" in member
              ? await Promise.all(
                  (member as ApiFunction).parameters.map(async (parameter) => ({
                    name: parameter.name,
                    isOptional: parameter.isOptional,
                    type: parameter.parameterTypeExcerpt.text,
                    summary: parameter.tsdocParamBlock
                      ? tsdocNodeContainerToData(
                          parameter.tsdocParamBlock.content,
                          resolveDeclarationReference
                        )
                      : "No Description",
                  }))
                )
              : undefined,
        }
      })
    ),
    summary,
  }
}

export const makeData = async () => {
  const data = [] as ApiData[]
  for (const pkg of model.packages) {
    for (const entryPoint of pkg.entryPoints) {
      data.push(await makeDataForPackage(pkg, entryPoint))
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
  summary?: ReturnType<typeof tsdocNodeContainerToData>
  members: {
    kind: ApiItem["kind"]
    name: string
    signature?: string
    summary?: ReturnType<typeof tsdocNodeContainerToData>
    remarks?: ReturnType<typeof tsdocNodeToData>
    modifiers?: string[]
    type?: ReturnType<typeof tsdocNodeToData>
    parameters?: {
      name: string
      type: string
      summary?: ReturnType<typeof tsdocNodeContainerToData> | string
    }[]
  }[]
}
