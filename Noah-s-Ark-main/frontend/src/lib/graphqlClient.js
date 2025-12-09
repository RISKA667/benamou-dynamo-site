const DEFAULT_ENDPOINT = "/api/graphql";
export class GraphQLRequestError extends Error {
    constructor(message, extensions) {
        super(message);
        Object.defineProperty(this, "extensions", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.name = "GraphQLRequestError";
        this.extensions = extensions;
    }
}
export async function graphqlRequest({ query, variables, signal, }) {
    const endpoint = import.meta.env.VITE_GRAPHQL_URL ?? DEFAULT_ENDPOINT;
    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, variables }),
        signal,
    });
    if (!response.ok) {
        throw new Error(`GraphQL request failed (${response.status})`);
    }
    const payload = (await response.json());
    if (payload.errors?.length) {
        const [firstError] = payload.errors;
        throw new GraphQLRequestError(firstError?.message ?? "GraphQL error", firstError?.extensions);
    }
    if (!payload.data) {
        throw new Error("Réponse GraphQL vide");
    }
    return payload.data;
}
