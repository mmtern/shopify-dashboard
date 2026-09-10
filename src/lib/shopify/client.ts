// src/lib/shopify/client.ts

const SHOPIFY_STORE = process.env.SHOPIFY_STORE || "";
const SHOPIFY_CLIENT_ID = process.env.SHOPIFY_CLIENT_ID || "";
const SHOPIFY_CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET || "";
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || "";
const API_VERSION = "2026-07";

// Re-fetch this far before the token actually expires, so one can't lapse mid-request.
const TOKEN_REFRESH_MARGIN_MS = 60_000;
// Used when Shopify omits expires_in, so a missing value can't produce a NaN
// deadline that silently disables the cache.
const DEFAULT_TOKEN_TTL_S = 86_400;

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
	const response = await fetch(`https://${SHOPIFY_STORE}/admin/oauth/access_token`, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
		body: new URLSearchParams({
			grant_type: "client_credentials",
			client_id: SHOPIFY_CLIENT_ID,
			client_secret: SHOPIFY_CLIENT_SECRET,
		}),
	});

	// Shopify answers this endpoint with an HTML error page unless Accept asks for
	// JSON, and even then some failures aren't JSON — so read text and try to parse.
	const raw = await response.text();
	let data: { access_token?: string; expires_in?: number; error?: string; error_description?: string } | null = null;
	try {
		data = JSON.parse(raw);
	} catch {
		data = null;
	}

	if (!response.ok || !data?.access_token) {
		// app_not_installed is by far the most common cause and the message alone
		// doesn't say what to do about it.
		if (data?.error === "app_not_installed") {
			throw new Error(
				`Shopify app is not installed on ${SHOPIFY_STORE}. Install it from the Shopify Dev Dashboard (your app → Overview → Install), then retry.`,
			);
		}
		const detail = data ? JSON.stringify(data) : raw.slice(0, 200);
		throw new Error(`Shopify token request failed: ${response.status} ${detail}`);
	}

	cachedToken = {
		token: data.access_token,
		expiresAt: Date.now() + (data.expires_in ?? DEFAULT_TOKEN_TTL_S) * 1000,
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
	if (!SHOPIFY_STORE) {
		throw new Error("Shopify credentials not configured: SHOPIFY_STORE is missing.");
	}

	if (!SHOPIFY_ACCESS_TOKEN && !(SHOPIFY_CLIENT_ID && SHOPIFY_CLIENT_SECRET)) {
		throw new Error(
			"Shopify credentials not configured: set SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET (or SHOPIFY_ACCESS_TOKEN).",
		);
	}

	const accessToken = await getAccessToken();

	const response = await fetch(`https://${SHOPIFY_STORE}/admin/api/${API_VERSION}/graphql.json`, {
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
