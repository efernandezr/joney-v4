import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Badge, Button, Checkbox, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, Tabs, TabsContent, TabsList, TabsTrigger, Textarea, } from "@agent-native/toolkit/ui";
import { IconCheck, IconFileText, IconLink, IconPlus, IconShieldCheck, IconX, } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { parseContextMembershipsForResource, parseCreativeContexts, useContextMemberships, useCreativeContexts, useManageContextMembership, useManageCreativeContext, } from "./actions.js";
const MAX_CONTEXT_RESOURCES = 50;
export function normalizeCreativeContextResources(resource, resources) {
    const candidates = resources?.length ? resources : resource ? [resource] : [];
    const seen = new Set();
    return candidates.filter((candidate) => {
        const key = `${candidate.appId}:${candidate.resourceType}:${candidate.resourceId}`;
        if (seen.has(key) || seen.size >= MAX_CONTEXT_RESOURCES)
            return false;
        seen.add(key);
        return true;
    });
}
const VISIBILITY_RANK = { private: 0, org: 1, public: 2 };
export function requiresBroaderPublication(resource, context) {
    return Boolean(context &&
        VISIBILITY_RANK[context.visibility] >
            VISIBILITY_RANK[resource.visibility ?? "private"]);
}
export function creativeContextSafePreviewUrl(url) {
    if (!url)
        return null;
    try {
        if (typeof window === "undefined") {
            return new URL(url).protocol === "https:" ? url : null;
        }
        const parsed = new URL(url, window.location.origin);
        return parsed.protocol === "https:" ||
            parsed.origin === window.location.origin
            ? parsed.href
            : null;
    }
    catch {
        return null;
    }
}
function policyCopy(policy) {
    switch (policy) {
        case "review":
            return "New resources wait for reviewer approval before they are reused.";
        case "admins-only":
            return "Only administrators can approve or remove resources.";
        default:
            return "New resources are published after submission.";
    }
}
function formatResourceTimestamp(value) {
    if (!value)
        return null;
    const date = new Date(value);
    if (!Number.isFinite(date.getTime()))
        return null;
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}
function ResourcePreview({ resource, }) {
    const imageUrl = creativeContextSafePreviewUrl(resource.preview?.imageUrl);
    if (imageUrl) {
        return (_jsx("img", { src: imageUrl, alt: resource.preview?.alt ?? "", className: "size-11 rounded-md border border-border object-cover" }));
    }
    return (_jsx("div", { className: "flex size-11 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground", children: _jsx(IconFileText, { className: "size-5" }) }));
}
export async function submitCreativeContextResources({ contextId, resources, rank, purpose, note, confirmBroaderPublication, mutateAsync, }) {
    const results = await Promise.allSettled(resources.map((resource) => mutateAsync({
        operation: "submit",
        contextId,
        nativeResource: {
            appId: resource.appId,
            resourceType: resource.resourceType,
            resourceId: resource.resourceId,
            expectedUpdatedAt: resource.updatedAt,
        },
        rank,
        purpose,
        note,
        confirmBroaderPublication,
    })));
    return {
        submitted: results.filter((result) => result.status === "fulfilled").length,
        failed: results.filter((result) => result.status === "rejected").length,
    };
}
function MembershipRow({ membership, updateAvailable, canReview, canWithdraw, canRemove, busy, onAction, }) {
    const pending = Boolean(membership.pendingSubmissionId);
    return (_jsxs("article", { className: "flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium", children: pending ? "Pending resource" : "Published resource" }), _jsxs("p", { className: "mt-0.5 text-xs text-muted-foreground", children: [membership.rank, " ", membership.purpose ? `· ${membership.purpose}` : ""] })] }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [pending ? (_jsx(Badge, { variant: "outline", children: "Pending review" })) : (_jsx(Badge, { variant: "secondary", children: "Published" })), updateAvailable ? (_jsx(Badge, { variant: "outline", children: "Update available" })) : null, pending && canWithdraw ? (_jsx(Button, { type: "button", variant: "outline", size: "sm", disabled: busy, onClick: () => onAction("withdraw"), children: "Withdraw" })) : null, pending && canReview ? (_jsxs(Button, { type: "button", size: "sm", disabled: busy, onClick: () => onAction("approve"), children: [_jsx(IconCheck, {}), " Approve"] })) : null, pending && canReview ? (_jsx(Button, { type: "button", size: "sm", variant: "outline", disabled: busy, onClick: () => onAction("request-changes"), children: "Request changes" })) : null, canRemove ? (_jsxs(Button, { type: "button", size: "sm", variant: "ghost", disabled: busy, onClick: () => onAction("remove"), children: [_jsx(IconX, {}), " Remove"] })) : null] })] }));
}
function ContextSelect({ contexts, contextId, onValueChange, }) {
    return (_jsxs(Select, { value: contextId, onValueChange: onValueChange, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Choose a context" }) }), _jsx(SelectContent, { "data-agent-native-share-overlay": "", className: "z-[100020]", children: contexts.map((context) => (_jsx(SelectItem, { value: context.id, children: context.name }, context.id))) })] }));
}
export function CreativeContextShareTab({ resource, resources, className, }) {
    const contextsQuery = useCreativeContexts();
    const manageContext = useManageCreativeContext();
    const manageMembership = useManageContextMembership();
    const contexts = parseCreativeContexts(contextsQuery.data);
    const selectedResources = normalizeCreativeContextResources(resource, resources);
    const primaryResource = selectedResources[0];
    const updatedAt = formatResourceTimestamp(primaryResource?.updatedAt);
    const [contextId, setContextId] = useState("");
    const membershipsQuery = useContextMemberships(contextId ? { contextId } : null);
    const memberships = parseContextMembershipsForResource(membershipsQuery.data, primaryResource ?? { appId: "", resourceType: "", resourceId: "" });
    const [rank, setRank] = useState("normal");
    const [purpose, setPurpose] = useState("");
    const [note, setNote] = useState("");
    const [newContextName, setNewContextName] = useState("");
    const [error, setError] = useState(null);
    const [submitSummary, setSubmitSummary] = useState(null);
    const [confirmedBroaderPublication, setConfirmedBroaderPublication] = useState(false);
    const busy = manageContext.isPending || manageMembership.isPending;
    const selectedContext = contexts.find((context) => context.id === contextId);
    const canCreateContext = contexts.some((context) => context.access.canAdmin);
    const needsBroaderPublicationConfirmation = selectedResources.some((item) => requiresBroaderPublication(item, selectedContext));
    useEffect(() => {
        if (!contextId && contexts[0]?.id)
            setContextId(contexts[0].id);
    }, [contextId, contexts]);
    async function refresh() {
        await Promise.all([contextsQuery.refetch(), membershipsQuery.refetch()]);
    }
    async function submit() {
        if (!contextId ||
            !selectedResources.length ||
            (needsBroaderPublicationConfirmation && !confirmedBroaderPublication))
            return;
        setError(null);
        try {
            const result = await submitCreativeContextResources({
                contextId,
                resources: selectedResources,
                rank,
                purpose: purpose.trim() || undefined,
                note: note.trim() || undefined,
                confirmBroaderPublication: needsBroaderPublicationConfirmation
                    ? true
                    : undefined,
                mutateAsync: manageMembership.mutateAsync,
            });
            setPurpose("");
            setNote("");
            setConfirmedBroaderPublication(false);
            setSubmitSummary(result.failed
                ? `${result.submitted} submitted; ${result.failed} could not be submitted.`
                : `${result.submitted} ${result.submitted === 1 ? "resource" : "resources"} submitted.`);
            await refresh();
        }
        catch {
            setError("Could not submit this resource to the selected context.");
        }
    }
    async function createContext() {
        if (!newContextName.trim())
            return;
        setError(null);
        try {
            const result = await manageContext.mutateAsync({
                operation: "create",
                name: newContextName.trim(),
                kind: "specialty",
                approvalPolicy: "open",
            });
            setNewContextName("");
            await contextsQuery.refetch();
            if (result.context?.id)
                setContextId(result.context.id);
        }
        catch {
            setError("Could not create a context.");
        }
    }
    async function act(membershipId, operation) {
        if (!contextId)
            return;
        setError(null);
        try {
            await manageMembership.mutateAsync({
                operation,
                contextId,
                membershipId,
            });
            await refresh();
        }
        catch {
            setError("Could not update this context membership.");
        }
    }
    return (_jsxs("section", { className: className, "aria-label": "Creative context", children: [_jsxs("div", { className: "flex items-start gap-3 border-b border-border/70 pb-4", children: [primaryResource ? (_jsx(ResourcePreview, { resource: primaryResource })) : null, _jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "truncate text-sm font-medium", children: selectedResources.length === 1
                                    ? primaryResource?.title
                                    : `${selectedResources.length} selected resources` }), _jsx("p", { className: "mt-0.5 text-xs text-muted-foreground", children: selectedResources.length === 1
                                    ? (primaryResource?.preview?.label ??
                                        primaryResource?.resourceType)
                                    : "Each resource is submitted separately" }), selectedResources.length === 1 && updatedAt ? (_jsxs("p", { className: "mt-0.5 text-xs text-muted-foreground", children: ["Current version \u00B7 ", updatedAt] })) : null] })] }), _jsxs(Tabs, { defaultValue: "contexts", className: "mt-4", children: [_jsxs(TabsList, { className: "w-full justify-start", children: [_jsx(TabsTrigger, { value: "contexts", children: "Contexts" }), _jsx(TabsTrigger, { value: "policy", children: "Policy" })] }), _jsxs(TabsContent, { value: "contexts", className: "space-y-3", children: [_jsx(ContextSelect, { contexts: contexts, contextId: contextId, onValueChange: setContextId }), selectedContext ? (_jsxs("p", { className: "text-xs text-muted-foreground", children: [selectedContext.description ||
                                        `${selectedContext.memberCount} published resources`, " ", "\u00B7 ", policyCopy(selectedContext.approvalPolicy)] })) : (_jsx("p", { className: "text-sm text-muted-foreground", children: "No contexts are available yet." })), contextId && selectedResources.length === 1 ? (_jsxs("div", { className: "space-y-2", children: [memberships.map((membership) => (_jsx(MembershipRow, { membership: membership, updateAvailable: Boolean(primaryResource?.updatedAt &&
                                            membership.publishedItem?.sourceModifiedAt &&
                                            primaryResource.updatedAt !==
                                                membership.publishedItem.sourceModifiedAt), canReview: selectedContext?.access.canReview === true, canWithdraw: selectedContext?.access.canReview === true ||
                                            selectedContext?.access.canSubmit === true, canRemove: selectedContext?.access.canAdmin === true, busy: busy, onAction: (operation) => void act(membership.id, operation) }, membership.id))), !memberships.length && !membershipsQuery.isLoading ? (_jsx("p", { className: "text-sm text-muted-foreground", children: "This resource has not been submitted to this context." })) : null] })) : null, contextId && selectedResources.length ? (_jsxs("div", { className: "rounded-md border border-dashed border-border p-3", children: [_jsxs("p", { className: "text-sm font-medium", children: [memberships.some((membership) => membership.publishedItem)
                                                ? "Submit update for "
                                                : "Add ", selectedResources.length === 1
                                                ? "this resource"
                                                : `${selectedResources.length} resources`] }), _jsxs("div", { className: "mt-2 grid gap-2 sm:grid-cols-2", children: [_jsxs(Select, { value: rank, onValueChange: (value) => setRank(value), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { "data-agent-native-share-overlay": "", className: "z-[100020]", children: [_jsx(SelectItem, { value: "canonical", children: "Canonical" }), _jsx(SelectItem, { value: "exemplar", children: "Exemplar" }), _jsx(SelectItem, { value: "normal", children: "Reference" })] })] }), _jsx(Input, { value: purpose, onChange: (event) => setPurpose(event.target.value), placeholder: "Purpose" })] }), _jsx(Textarea, { className: "mt-2", value: note, onChange: (event) => setNote(event.target.value), placeholder: "Note for reviewers", rows: 2 }), needsBroaderPublicationConfirmation ? (_jsxs("label", { className: "mt-3 flex items-start gap-2 text-xs text-muted-foreground", children: [_jsx(Checkbox, { checked: confirmedBroaderPublication, onCheckedChange: (checked) => setConfirmedBroaderPublication(checked === true) }), _jsx("span", { children: "This context is shared more broadly than this resource. Publishing creates a governed copy available to the context's audience." })] })) : null, _jsxs(Button, { type: "button", className: "mt-3", size: "sm", disabled: busy ||
                                            selectedContext?.access.canSubmit !== true ||
                                            (needsBroaderPublicationConfirmation &&
                                                !confirmedBroaderPublication), onClick: () => void submit(), children: [_jsx(IconLink, {}), " Submit"] })] })) : null, canCreateContext ? (_jsxs("div", { className: "flex gap-2 border-t border-border/60 pt-3", children: [_jsx(Input, { value: newContextName, onChange: (event) => setNewContextName(event.target.value), placeholder: "New context name" }), _jsxs(Button, { type: "button", variant: "outline", size: "sm", disabled: busy || !newContextName.trim(), onClick: () => void createContext(), children: [_jsx(IconPlus, {}), " New"] })] })) : null, error ? _jsx("p", { className: "text-xs text-destructive", children: error }) : null, submitSummary ? (_jsx("p", { className: "text-xs text-muted-foreground", children: submitSummary })) : null] }), _jsxs(TabsContent, { value: "policy", className: "space-y-3 text-sm text-muted-foreground", children: [_jsxs("div", { className: "flex gap-2 rounded-md border border-border p-3", children: [_jsx(IconShieldCheck, { className: "mt-0.5 size-4 shrink-0" }), _jsx("p", { children: "Open contexts publish submitted resources, review contexts wait for approval, and admins-only contexts require an administrator." })] }), selectedContext ? (_jsx("p", { children: policyCopy(selectedContext.approvalPolicy) })) : null] })] })] }));
}
export function CreativeContextShareSheet({ resource, resources, open, onOpenChange, canManage, }) {
    return (_jsx(Sheet, { open: open, onOpenChange: onOpenChange, children: _jsxs(SheetContent, { side: "right", className: "w-full overflow-y-auto sm:max-w-lg", children: [_jsxs(SheetHeader, { children: [_jsx(SheetTitle, { children: "Creative context" }), _jsx(SheetDescription, { children: "Place this resource in a governed context for future reuse." })] }), _jsx(CreativeContextShareTab, { resource: resource, resources: resources, canManage: canManage, className: "mt-5" })] }) }));
}
//# sourceMappingURL=CreativeContextShareTab.js.map