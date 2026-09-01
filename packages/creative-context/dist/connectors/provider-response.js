export class ContextConnectorQuotaError extends Error {
    provider;
    retryAt;
    retryAfterMs;
    constructor(input) {
        super(`Provider quota exhausted; retry after ${input.retryAt}.`);
        this.name = "ContextConnectorQuotaError";
        this.provider = input.provider;
        this.retryAt = input.retryAt;
        this.retryAfterMs = Math.max(0, input.retryAfterMs ?? 0);
    }
}
export function isContextConnectorQuotaError(value) {
    return value instanceof ContextConnectorQuotaError;
}
export async function executeConnectorProviderRequest(runtime, args) {
    if (!runtime) {
        throw new Error(`The ${args.provider} connector requires a provider API runtime.`);
    }
    const raw = (await runtime.executeRequest(args));
    const response = asRecord(raw.response);
    if (!response)
        return raw;
    const quota = asRecord(response.quota);
    if (quota?.exhausted === true) {
        throw new ContextConnectorQuotaError({
            provider: stringValue(quota.providerId) ?? String(args.provider),
            retryAt: stringValue(quota.retryAt) ??
                new Date(Date.now() + Number(quota.retryAfterMs ?? 60_000)).toISOString(),
            retryAfterMs: Number(quota.retryAfterMs ?? 0),
        });
    }
    if (response.ok !== true) {
        const status = response.status ?? "unknown";
        const detail = response.text ?? response.json ?? response.statusText ?? "";
        throw new Error(`Provider request failed (${String(status)}): ${brief(detail)}`);
    }
    if (response.json !== undefined)
        return response.json;
    if (typeof response.text === "string") {
        try {
            return JSON.parse(response.text);
        }
        catch {
            return response.text;
        }
    }
    return null;
}
export async function connectorConnectionId(provider, config, resolve) {
    const requested = stringValue(config.connectionId);
    const credentialMode = stringValue(config.credentialMode);
    if (credentialMode === "admin-token" || config.useAdminToken === true) {
        if (provider !== "figma") {
            throw new Error(`${provider} creative-context imports require a per-user granted workspace connection; admin-token mode is not allowed.`);
        }
        if (requested) {
            throw new Error(`${provider} connector config cannot combine connectionId with admin-token credentialMode.`);
        }
        return undefined;
    }
    if (!resolve) {
        throw new Error(`${provider} creative-context imports require a workspace connection resolver.`);
    }
    const resolved = await resolve(provider, requested);
    if (!resolved) {
        throw new Error(`${provider} creative-context imports require a granted workspace connection.`);
    }
    return resolved;
}
export function asRecord(value) {
    return value && typeof value === "object" && !Array.isArray(value)
        ? value
        : null;
}
export function stringValue(value) {
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
export function stringArray(value) {
    return Array.isArray(value)
        ? value.map(stringValue).filter((item) => Boolean(item))
        : [];
}
export function positiveLimit(value, fallback = 100, max = 1_000) {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0
        ? Math.min(parsed, max)
        : fallback;
}
export function cursorOffset(cursor) {
    const parsed = Number(cursor ?? 0);
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}
function brief(value) {
    const text = typeof value === "string" ? value : JSON.stringify(value);
    return (text ?? "").slice(0, 500);
}
//# sourceMappingURL=provider-response.js.map