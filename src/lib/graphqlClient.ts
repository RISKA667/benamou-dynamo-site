type Variables = Record<string, unknown> | undefined;

const DEFAULT_ENDPOINT = "/api/graphql";

export class GraphQLRequestError extends Error {
  public readonly extensions?: Record<string, unknown>;

  constructor(message: string, extensions?: Record<string, unknown>) {
    super(message);
    this.name = "GraphQLRequestError";
    this.extensions = extensions;
  }
}

interface GraphQLResponse<TData> {
  data?: TData;
  errors?: Array<{
    message: string;
    extensions?: Record<string, unknown>;
  }>;
}

export interface GraphQLRequestOptions<TVariables extends Variables = Variables> {
  query: string;
  variables?: TVariables;
  signal?: AbortSignal;
}

export async function graphqlRequest<TData, TVariables extends Variables = Variables>({
  query,
  variables,
  signal,
}: GraphQLRequestOptions<TVariables>): Promise<TData> {
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

  const payload = (await response.json()) as GraphQLResponse<TData>;

  if (payload.errors?.length) {
    const [firstError] = payload.errors;
    throw new GraphQLRequestError(
      firstError?.message ?? "GraphQL error",
      firstError?.extensions,
    );
  }

  if (!payload.data) {
    throw new Error("Réponse GraphQL vide");
  }

  return payload.data;
}
