import { getRequestOrgId, getRequestUserEmail, } from "@agent-native/core/server/request-context";
import { assertAccess } from "@agent-native/core/sharing";
const proofBrand = Symbol("creative-context-generation-artifact-access");
const CAPABILITY_LIFETIME_MS = 60_000;
export async function assertGenerationArtifactAccess(identity, target, minRole) {
    await assertAccess(target.resourceType, target.resourceId, minRole, undefined, {
        skipResourceBody: true,
    });
    return createProof(identity, minRole);
}
export function assertGenerationArtifactAccessProof(identity, proof, minRole) {
    if (proof?.[proofBrand] !== true ||
        proof.identityKey !== generationIdentityKey(identity) ||
        (minRole === "editor" && proof.minRole !== "editor")) {
        throw new Error("Generation artifact access must be verified by the host application");
    }
}
export async function createGenerationArtifactAccessCapability(identity, target, operation) {
    const minRole = operation === "record" ? "editor" : "viewer";
    await assertGenerationArtifactAccess(identity, target, minRole);
    const actor = requireCapabilityActor();
    const claims = {
        version: 1,
        operation,
        identityKey: generationIdentityKey(identity),
        minRole,
        resourceType: target.resourceType,
        resourceId: target.resourceId,
        userEmail: actor.userEmail,
        orgId: actor.orgId,
        expiresAt: Date.now() + CAPABILITY_LIFETIME_MS,
    };
    const encoded = Buffer.from(JSON.stringify(claims), "utf8").toString("base64url");
    const signature = await signCapability(encoded);
    return `${encoded}.${signature}`;
}
export async function verifyGenerationArtifactAccessCapability(token, identity, operation) {
    const [encoded, signature, extra] = token.split(".");
    if (!encoded || !signature || extra) {
        throw new Error("Invalid generation artifact access capability");
    }
    const valid = await verifyCapabilitySignature(encoded, signature);
    if (!valid)
        throw new Error("Invalid generation artifact access capability");
    let claims;
    try {
        claims = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    }
    catch {
        throw new Error("Invalid generation artifact access capability");
    }
    const actor = requireCapabilityActor();
    const expectedRole = operation === "record" ? "editor" : "viewer";
    if (claims.version !== 1 ||
        claims.operation !== operation ||
        claims.identityKey !== generationIdentityKey(identity) ||
        claims.minRole !== expectedRole ||
        claims.userEmail !== actor.userEmail ||
        claims.orgId !== actor.orgId ||
        !Number.isSafeInteger(claims.expiresAt) ||
        claims.expiresAt < Date.now() ||
        claims.expiresAt > Date.now() + CAPABILITY_LIFETIME_MS) {
        throw new Error("Invalid generation artifact access capability");
    }
    return createProof(identity, expectedRole);
}
function createProof(identity, minRole) {
    return Object.freeze({
        identityKey: generationIdentityKey(identity),
        minRole,
        [proofBrand]: true,
    });
}
function generationIdentityKey(identity) {
    return JSON.stringify([
        identity.appId,
        identity.artifactType,
        identity.artifactId,
    ]);
}
function requireCapabilityActor() {
    const userEmail = getRequestUserEmail()?.trim().toLowerCase();
    if (!userEmail)
        throw new Error("Not authenticated");
    return { userEmail, orgId: getRequestOrgId() ?? null };
}
function capabilitySecret() {
    const secret = process.env.CREATIVE_CONTEXT_A2A_KEY?.trim() ||
        process.env.A2A_SECRET?.trim();
    if (!secret) {
        throw new Error("Generation artifact access capabilities require CREATIVE_CONTEXT_A2A_KEY or A2A_SECRET");
    }
    return secret;
}
async function signCapability(encoded) {
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(capabilitySecret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(encoded));
    return Buffer.from(signature).toString("base64url");
}
async function verifyCapabilitySignature(encoded, signature) {
    let bytes;
    try {
        bytes = Buffer.from(signature, "base64url");
        if (Buffer.from(bytes).toString("base64url") !== signature)
            return false;
    }
    catch {
        return false;
    }
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(capabilitySecret()), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    return crypto.subtle.verify("HMAC", key, bytes, new TextEncoder().encode(encoded));
}
//# sourceMappingURL=generation-artifact-access.js.map