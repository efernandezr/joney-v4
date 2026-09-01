import { readAppState } from "@agent-native/core/application-state";
import { getRequestOrgId } from "@agent-native/core/server/request-context";
import { getGenerationCreativeContext as getGenerationCreativeContextLocal, recordGenerationCreativeContext as recordGenerationCreativeContextLocal, } from "../store/generation.js";
import { createContextPack, getCreativeContextAppBinding, getCreativeContextById, getContextPack, getCreativeContextItem, listCreativeContexts, listAccessibleSearchDocuments, } from "../store/index.js";
import { sanitizeUntrustedReference, UNTRUSTED_REFERENCE_ROLE, } from "../untrusted-reference.js";
import { assertGenerationArtifactAccess, createGenerationArtifactAccessCapability, } from "./generation-artifact-access.js";
import { callIsolatedCreativeContextA2A, hasIsolatedCreativeContextA2A, isolatedResolvePayload, } from "./isolated-a2a.js";
import { performCreativeContextSearch } from "./retrieval.js";
const SPECIALTY_STOP_WORDS = new Set([
    "and",
    "for",
    "from",
    "into",
    "our",
    "the",
    "this",
    "with",
]);
function specialtyTokens(value) {
    return new Set(value
        .toLocaleLowerCase()
        .split(/[^\p{L}\p{N}]+/u)
        .filter((token) => token.length >= 3 && !SPECIALTY_STOP_WORDS.has(token)));
}
export function selectSemanticSpecialty(contexts, query) {
    const queryText = query.toLocaleLowerCase();
    const queryTokens = specialtyTokens(query);
    let best = null;
    for (const context of contexts) {
        if (context.kind !== "specialty")
            continue;
        const name = context.name.toLocaleLowerCase().trim();
        const nameTokens = specialtyTokens(context.name);
        const descriptionTokens = specialtyTokens(context.description ?? "");
        let score = name.length >= 3 && queryText.includes(name) ? 4 : 0;
        for (const token of queryTokens) {
            if (nameTokens.has(token))
                score += 2;
            else if (descriptionTokens.has(token))
                score += 1;
        }
        if (score >= 2 && (!best || score > best.score))
            best = { context, score };
    }
    return best?.context ?? null;
}
function defaultArtifactAccessTarget(identity) {
    if (identity.appId === "slides" && identity.artifactType === "deck") {
        return { resourceType: "deck", resourceId: identity.artifactId };
    }
    if (identity.appId === "design" && identity.artifactType === "design") {
        return { resourceType: "design", resourceId: identity.artifactId };
    }
    if (identity.appId === "content" && identity.artifactType === "document") {
        return { resourceType: "document", resourceId: identity.artifactId };
    }
    return undefined;
}
function collaborativeArtifactTarget(identity, explicit) {
    if (!getRequestOrgId())
        return undefined;
    return explicit ?? defaultArtifactAccessTarget(identity);
}
export function mergeCreativeContextReuseLabels(previous, next) {
    return Array.from(new Map([...previous, ...next].map((label) => [
        [
            label.itemId ?? "",
            label.itemVersionId ?? "",
            label.elementId ?? "",
            label.influence ?? "reference-conditioned",
            label.kind,
            label.label,
        ].join("\u0000"),
        label,
    ])).values());
}
export function replaceCreativeContextElementProvenance(previous, next) {
    const replacedElementIds = new Set(next.map((entry) => entry.elementId));
    const merged = [
        ...previous.filter((entry) => !replacedElementIds.has(entry.elementId)),
        ...next,
    ];
    return Array.from(new Map(merged.map((entry) => [
        [
            entry.elementId,
            entry.influence,
            entry.itemId ?? "",
            entry.itemVersionId ?? "",
            entry.label ?? "",
        ].join("\u0000"),
        entry,
    ])).values());
}
export function validateCreativeContextReuseLabels(labels, options = {}) {
    return labels.map((label) => {
        const influence = label.influence ?? "reference-conditioned";
        const hasItemId = Boolean(label.itemId);
        const hasItemVersionId = Boolean(label.itemVersionId);
        if (hasItemId !== hasItemVersionId) {
            throw new Error("Generation reuse labels must provide both itemId and itemVersionId");
        }
        if (influence !== "generated" && !hasItemId) {
            throw new Error("Only generated element labels may omit itemId and itemVersionId");
        }
        if (options.generatedOnly && influence !== "generated") {
            throw new Error("Creative context is off; only generated element labels may be recorded");
        }
        if (hasItemId &&
            options.allowedEvidence &&
            !options.allowedEvidence.has(`${label.itemId}:${label.itemVersionId}`)) {
            throw new Error("Generation reuse labels must belong to contextPackId");
        }
        return { ...label, influence };
    });
}
async function exactPackContext(packId) {
    const pack = await getContextPack(packId);
    if (!pack)
        throw new Error("Context pack not found or not accessible");
    const details = await Promise.all(pack.members.map((member) => getCreativeContextItem(member.itemId, member.itemVersionId)));
    const results = details.flatMap((detail) => detail
        ? [
            {
                itemId: detail.item.id,
                itemVersionId: detail.version.id,
                kind: detail.item.kind,
                title: sanitizeUntrustedReference(detail.item.title),
                excerpt: sanitizeUntrustedReference(detail.version.summary ?? detail.version.content.slice(0, 600)),
                dataRole: UNTRUSTED_REFERENCE_ROLE,
            },
        ]
        : []);
    const reuseLabels = results.map((result) => ({
        itemId: result.itemId,
        itemVersionId: result.itemVersionId,
        kind: result.kind,
        label: result.title,
        dataRole: UNTRUSTED_REFERENCE_ROLE,
    }));
    return {
        contextMode: "pinned",
        contextPackId: pack.id,
        reuseLabels,
        results,
    };
}
export async function resolveGenerationCreativeContext(input) {
    if (input.contextModeOverride === "off") {
        return resolveGenerationCreativeContextLocal(input);
    }
    if (hasIsolatedCreativeContextA2A()) {
        const state = (await readAppState("creative-context").catch(() => null));
        if (state?.contextMode === "off") {
            return resolveGenerationCreativeContextLocal(input);
        }
        return callIsolatedCreativeContextA2A("resolve", {
            ...isolatedResolvePayload(input),
            ...(input.contextPackId || !state?.pinnedPackId
                ? {}
                : {
                    contextPackId: state.pinnedPackId,
                    contextPackSource: "inherited",
                }),
            ...(state?.selectedContextId
                ? { selectedContextId: state.selectedContextId }
                : {}),
        });
    }
    return resolveGenerationCreativeContextLocal(input);
}
export async function resolveGenerationCreativeContextLocal(input) {
    if (input.contextModeOverride === "off") {
        if (input.contextPackId &&
            (input.contextPackSource ?? "explicit") === "explicit") {
            throw new Error("Creative context is off for this generation; contextPackId cannot be applied");
        }
        return {
            contextMode: "off",
            contextPackId: null,
            reuseLabels: [],
            results: [],
        };
    }
    const state = (await readAppState("creative-context").catch(() => null));
    if (state?.contextMode === "off") {
        if (input.contextPackId &&
            (input.contextPackSource ?? "explicit") === "explicit") {
            throw new Error("Creative context is off; an explicit contextPackId cannot be applied");
        }
        return {
            contextMode: "off",
            contextPackId: null,
            reuseLabels: [],
            results: [],
        };
    }
    if (input.contextPackId)
        return exactPackContext(input.contextPackId);
    const exactPackId = state?.pinnedPackId ?? undefined;
    if (exactPackId)
        return exactPackContext(exactPackId);
    if (!input.query?.trim()) {
        throw new Error("query is required when no exact contextPackId is supplied");
    }
    const selectedContextId = input.selectedContextId ?? state?.selectedContextId;
    const [contexts, selected, bound] = await Promise.all([
        listCreativeContexts({ limit: 100 }),
        selectedContextId ? getCreativeContextById(selectedContextId) : null,
        selectedContextId
            ? Promise.resolve(null)
            : getCreativeContextAppBinding(input.role),
    ]);
    const base = selected?.kind === "default"
        ? selected
        : (contexts.contexts.find((context) => context.kind === "default") ??
            null);
    const semantic = !selected && !bound
        ? selectSemanticSpecialty(contexts.contexts, input.query)
        : null;
    const specialty = selected?.kind === "specialty"
        ? selected
        : bound?.kind === "specialty"
            ? bound
            : semantic;
    const searchInput = {
        query: input.query,
        limit: Math.max(1, Math.min(20, input.limit ?? 8)),
        maxPerSource: 3,
        snapshot: false,
    };
    const [baseSearch, specialtySearch] = await Promise.all([
        base
            ? performCreativeContextSearch({ ...searchInput, contextId: base.id })
            : performCreativeContextSearch(searchInput),
        specialty
            ? performCreativeContextSearch({
                ...searchInput,
                contextId: specialty.id,
            })
            : Promise.resolve(null),
    ]);
    const fused = new Map();
    for (const result of baseSearch.results)
        fused.set(`${result.itemId}:${result.itemVersionId}`, result);
    for (const result of specialtySearch?.results ?? []) {
        const key = `${result.itemId}:${result.itemVersionId}`;
        const existing = fused.get(key);
        fused.set(key, {
            ...result,
            score: Math.max(result.score + 0.15, existing?.score ?? Number.NEGATIVE_INFINITY),
            reasons: [...(existing?.reasons ?? []), "specialty context boost"],
        });
    }
    const results = [...fused.values()]
        .sort((a, b) => b.score - a.score)
        .slice(0, searchInput.limit);
    if (!results.length) {
        return {
            contextMode: "auto",
            contextPackId: null,
            reuseLabels: [],
            results: [],
        };
    }
    const pack = await createContextPack({
        name: `${input.role}: ${input.query.slice(0, 100)}`,
        description: "Immutable governed-context generation snapshot.",
        contextMode: "auto",
        baseContextId: base?.id ?? null,
        specialtyContextId: specialty?.id ?? null,
        selectionReason: specialty
            ? selected?.id === specialty.id
                ? "explicit specialty selection"
                : bound?.id === specialty.id
                    ? "app specialty binding"
                    : "semantic specialty match"
            : base
                ? "Default context"
                : "legacy accessible corpus fallback",
        request: {
            query: input.query,
            role: input.role,
            baseContextId: base?.id ?? null,
            specialtyContextId: specialty?.id ?? null,
        },
        members: results.map((result) => ({
            itemId: result.itemId,
            itemVersionId: result.itemVersionId,
            reason: result.reasons.join("; ") || "governed context match",
            score: result.score,
        })),
    });
    return {
        contextMode: "auto",
        contextPackId: pack.id,
        reuseLabels: results.map((result) => ({
            itemId: result.itemId,
            itemVersionId: result.itemVersionId,
            kind: result.kind,
            label: sanitizeUntrustedReference(result.title)
                .replaceAll("<<<UNTRUSTED_REFERENCE>>>", "")
                .replaceAll("<<<END_UNTRUSTED_REFERENCE>>>", "")
                .trim(),
            dataRole: UNTRUSTED_REFERENCE_ROLE,
        })),
        results,
    };
}
export async function validateGenerationCreativeContext(input) {
    if (input.contextModeOverride === "off") {
        return validateGenerationCreativeContextLocal(input);
    }
    if (hasIsolatedCreativeContextA2A()) {
        const state = (await readAppState("creative-context").catch(() => null));
        if (state?.contextMode === "off") {
            return validateGenerationCreativeContextLocal(input);
        }
        return callIsolatedCreativeContextA2A("validate", {
            contextPackId: input.contextPackId,
            contextPackSource: input.contextPackSource,
            reuseLabels: input.reuseLabels,
            reuseLabelsSource: input.reuseLabelsSource,
        });
    }
    return validateGenerationCreativeContextLocal(input);
}
export async function validateGenerationCreativeContextLocal(input) {
    const offReuseLabels = () => {
        const labels = input.reuseLabels ?? [];
        return input.reuseLabelsSource === "inherited"
            ? labels.filter((label) => (label.influence ?? "reference-conditioned") === "generated" &&
                !label.itemId &&
                !label.itemVersionId)
            : labels;
    };
    if (input.contextModeOverride === "off") {
        if (input.contextPackId &&
            (input.contextPackSource ?? "explicit") === "explicit") {
            throw new Error("Creative context is off for this generation; contextPackId cannot be applied");
        }
        return {
            contextMode: "off",
            contextPackId: null,
            reuseLabels: validateCreativeContextReuseLabels(offReuseLabels(), {
                generatedOnly: true,
            }),
            results: [],
        };
    }
    const state = (await readAppState("creative-context").catch(() => null));
    if (state?.contextMode === "off") {
        if (input.contextPackId &&
            (input.contextPackSource ?? "explicit") === "explicit") {
            throw new Error("Creative context is off; an explicit contextPackId cannot be applied");
        }
        return {
            contextMode: "off",
            contextPackId: null,
            reuseLabels: validateCreativeContextReuseLabels(offReuseLabels(), {
                generatedOnly: true,
            }),
            results: [],
        };
    }
    if (input.contextPackId) {
        const exact = await exactPackContext(input.contextPackId);
        const allowed = new Set(exact.reuseLabels.map((label) => `${label.itemId}:${label.itemVersionId}`));
        return {
            ...exact,
            reuseLabels: input.reuseLabels
                ? validateCreativeContextReuseLabels(input.reuseLabels, {
                    allowedEvidence: allowed,
                })
                : exact.reuseLabels,
        };
    }
    const anyContext = await listAccessibleSearchDocuments({ limit: 1 });
    if (anyContext.length === 0) {
        return {
            contextMode: "auto",
            contextPackId: null,
            reuseLabels: validateCreativeContextReuseLabels(input.reuseLabels ?? [], {
                generatedOnly: true,
            }),
            results: [],
        };
    }
    throw new Error("Creative context is enabled and available. Resolve context before the final write and pass its exact contextPackId and reuseLabels.");
}
export async function recordGenerationCreativeContext(input, options = {}) {
    const artifactAccessTarget = collaborativeArtifactTarget(input, options.artifactAccess);
    if (input.contextMode !== "off" &&
        !options.db &&
        hasIsolatedCreativeContextA2A()) {
        const artifactAccessCapability = artifactAccessTarget
            ? await createGenerationArtifactAccessCapability(input, artifactAccessTarget, "record")
            : undefined;
        return callIsolatedCreativeContextA2A("record", {
            ...input,
            artifactAccessCapability,
        });
    }
    const artifactAccess = artifactAccessTarget
        ? await assertGenerationArtifactAccess(input, artifactAccessTarget, "editor")
        : undefined;
    return recordGenerationCreativeContextLocal(input, {
        db: options.db,
        artifactAccess,
    });
}
export async function getGenerationCreativeContext(input, options = {}) {
    const artifactAccessTarget = collaborativeArtifactTarget(input, options.artifactAccess);
    if (!options.db && hasIsolatedCreativeContextA2A()) {
        const state = (await readAppState("creative-context").catch(() => null));
        if (state?.contextMode !== "off") {
            const artifactAccessCapability = artifactAccessTarget
                ? await createGenerationArtifactAccessCapability(input, artifactAccessTarget, "read")
                : undefined;
            return callIsolatedCreativeContextA2A("read", {
                identity: input,
                artifactAccessCapability,
            });
        }
    }
    const artifactAccess = artifactAccessTarget
        ? await assertGenerationArtifactAccess(input, artifactAccessTarget, "viewer")
        : undefined;
    return getGenerationCreativeContextLocal(input, {
        artifactAccess,
    });
}
//# sourceMappingURL=generation-context.js.map