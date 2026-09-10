// src/lib/shopify/client.ts

const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL || "";
const SHOPIFY_CLIENT_ID = process.env.SHOPIFY_CLIENT_ID || "";
const SHOPIFY_CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET || "";
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || "";
const API_VERSION = "2026-07";

// Re-fetch this far before the token actually expires, so one can't lapse mid-request.
const TOKEN_REFRESH_MARGIN_MS = 60_000;

interface ShopifyGraphQLResponse<T> {
	data: T;
	errors?: Array<{ message: string }>;
	extensions?: {
		cost: {
			requestedQueryCost: number;
			actualQueryCost: number;
			throttleStatus: {
				maximumAvailable: number;
				currentlyAvailable: number;
				restoreRate: number;
			};
		};
	};
}

let cachedToken: { token: string; expiresAt: number } | null = null;
// Held while a token request is in flight so concurrent callers share one request
// instead of each hitting the OAuth endpoint.
let pendingToken: Promise<string> | null = null;

async function requestAccessToken(): Promise<string> {
	const response = await fetch(`https://${SHOPIFY_STORE_URL}/admin/oauth/access_token`, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			grant_type: "client_credentials",
			client_id: SHOPIFY_CLIENT_ID,
			client_secret: SHOPIFY_CLIENT_SECRET,
		}),
	});

	const data = await response.json().catch(() => null);

	if (!response.ok || !data?.access_token) {
		throw new Error(`Shopify token request failed: ${response.status} ${JSON.stringify(data)}`);
	}

	cachedToken = {
		token: data.access_token,
		expiresAt: Date.now() + data.expires_in * 1000,
	};

	return cachedToken.token;
}

/**
 * Client credentials grant tokens last ~24h, so they're cached in memory and
 * refreshed on demand. A static SHOPIFY_ACCESS_TOKEN takes precedence when set,
 * which covers a legacy shpat_ token or pasting a short-lived one to test with.
 */
async function getAccessToken(): Promise<string> {
	if (SHOPIFY_ACCESS_TOKEN) return SHOPIFY_ACCESS_TOKEN;

	if (cachedToken && Date.now() < cachedToken.expiresAt - TOKEN_REFRESH_MARGIN_MS) {
		return cachedToken.token;
	}

	if (!pendingToken) {
		pendingToken = requestAccessToken().finally(() => {
			pendingToken = null;
		});
	}

	return pendingToken;
}

export async function shopifyGraphQL<T>(
	query: string,
	variables?: Record<string, unknown>,
): Promise<ShopifyGraphQLResponse<T>> {
	if (!SHOPIFY_STORE_URL) {
		throw new Error("Shopify credentials not configured: SHOPIFY_STORE_URL is missing.");
	}

	if (!SHOPIFY_ACCESS_TOKEN && !(SHOPIFY_CLIENT_ID && SHOPIFY_CLIENT_SECRET)) {
		throw new Error(
			"Shopify credentials not configured: set SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET (or SHOPIFY_ACCESS_TOKEN).",
		);
	}

	const accessToken = await getAccessToken();

	const response = await fetch(`https://${SHOPIFY_STORE_URL}/admin/api/${API_VERSION}/graphql.json`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-Shopify-Access-Token": accessToken,
		},
		body: JSON.stringify({ query, variables }),
	});

	if (!response.ok) {
		throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
	}

	// Shopify returns HTTP 200 with an `errors` array for GraphQL-level failures
	// (bad token, missing scope, invalid field), so this can't be left to response.ok.
	const json: ShopifyGraphQLResponse<T> = await response.json();

	if (json.errors?.length) {
		throw new Error(`Shopify GraphQL error: ${json.errors.map((e) => e.message).join("; ")}`);
	}

	return json;
}
