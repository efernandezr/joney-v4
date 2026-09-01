export class ContextImportConnectorRegistry {
    #connectors = new Map();
    constructor(connectors = []) {
        for (const connector of connectors)
            this.register(connector);
    }
    register(connector) {
        if (this.#connectors.has(connector.kind)) {
            throw new Error(`Context connector ${connector.kind} is already registered.`);
        }
        this.#connectors.set(connector.kind, connector);
        return this;
    }
    get(kind) {
        const connector = this.#connectors.get(kind);
        if (!connector) {
            throw new Error(`Unknown context connector ${kind}.`);
        }
        return connector;
    }
    has(kind) {
        return this.#connectors.has(kind);
    }
    list() {
        return [...this.#connectors.values()]
            .map((connector) => ({
            kind: connector.kind,
            label: connector.label,
            supportsIncremental: connector.supportsIncremental,
        }))
            .sort((a, b) => a.label.localeCompare(b.label));
    }
}
//# sourceMappingURL=registry.js.map