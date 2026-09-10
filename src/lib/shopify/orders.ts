// src/lib/shopify/orders.ts

import { shopifyGraphQL } from "./client";
import { ORDERS_QUERY } from "./queries";
import type { CustomAttribute, LineItem, OrderWithDetails, ShippingAddress, TaxLine } from "@/lib/types";

interface Money {
	shopMoney: { amount: string; currencyCode: string };
}

interface ShopifyAddress extends ShippingAddress {
	firstName: string | null;
	lastName: string | null;
	name: string | null;
}

interface ShopifyOrderNode {
	id: string;
	name: string;
	createdAt: string;
	displayFinancialStatus: string | null;
	displayFulfillmentStatus: string | null;
	email: string | null;
	phone: string | null;
	shippingAddress: ShopifyAddress | null;
	billingAddress: { name: string | null; phone: string | null } | null;
	shippingLines: { edges: Array<{ node: { title: string } }> };
	totalPriceSet: Money | null;
	subtotalPriceSet: Money | null;
	totalTaxSet: Money | null;
	totalDiscountsSet: Money | null;
	note: string | null;
	tags: string[];
	lineItems: {
		edges: Array<{
			node: {
				id: string;
				title: string;
				variantTitle: string | null;
				quantity: number;
				sku: string | null;
				originalUnitPriceSet: Money | null;
				discountedUnitPriceSet: Money | null;
				totalDiscountSet: Money | null;
				taxLines: Array<{ title: string; rate: number | null; priceSet: Money | null }>;
				customAttributes: CustomAttribute[];
				image: { url: string; altText: string | null } | null;
			};
		}>;
	};
}

interface OrdersQueryResult {
	orders: {
		edges: Array<{ cursor: string; node: ShopifyOrderNode }>;
		pageInfo: { hasNextPage: boolean; endCursor: string | null };
	};
}

export interface FetchOrdersOptions {
	first?: number;
	after?: string | null;
	/** Shopify search syntax, e.g. `created_at:>2026-01-01 financial_status:paid`. */
	query?: string | null;
}

export interface FetchOrdersResult {
	orders: OrderWithDetails[];
	pageInfo: { hasNextPage: boolean; endCursor: string | null };
}

function money(set: Money | null | undefined): number | null {
	if (!set) return null;
	const n = Number.parseFloat(set.shopMoney.amount);
	return Number.isFinite(n) ? n : null;
}

/**
 * The `customer` connection needs the read_customers scope, which this app
 * doesn't hold. Everything the dashboard displays is available on the order
 * itself, so name falls back shipping -> billing: digital-only orders (gang
 * sheets, no fulfillment) carry a billing address and no shipping one.
 */
function customerName(node: ShopifyOrderNode): string | null {
	const shipping = node.shippingAddress;
	const fromParts = [shipping?.firstName, shipping?.lastName].filter(Boolean).join(" ").trim();
	return fromParts || shipping?.name?.trim() || node.billingAddress?.name?.trim() || null;
}

// The query pulls names off the address for customerName(), but the stored
// shape is address-only — so drop them rather than leaking them into the row.
function mapShippingAddress(address: ShopifyAddress | null): ShippingAddress | null {
	if (!address) return null;
	return {
		address1: address.address1,
		address2: address.address2,
		city: address.city,
		province: address.province,
		country: address.country,
		zip: address.zip,
		phone: address.phone,
	};
}

function mapTaxLines(lines: ShopifyOrderNode["lineItems"]["edges"][number]["node"]["taxLines"]): TaxLine[] {
	return lines.map((line) => ({
		title: line.title,
		rate: line.rate ?? 0,
		amount: money(line.priceSet) ?? 0,
	}));
}

function mapLineItem(
	orderId: string,
	node: ShopifyOrderNode["lineItems"]["edges"][number]["node"],
	syncedAt: string,
): LineItem {
	return {
		id: node.id,
		order_id: orderId,
		title: node.title,
		variant_title: node.variantTitle,
		sku: node.sku,
		quantity: node.quantity,
		unit_price: money(node.originalUnitPriceSet),
		discounted_price: money(node.discountedUnitPriceSet),
		total_discount: money(node.totalDiscountSet),
		tax_lines: mapTaxLines(node.taxLines),
		custom_attributes: node.customAttributes,
		image_url: node.image?.url ?? null,
		synced_at: syncedAt,
	};
}

/**
 * Maps a Shopify order onto the dashboard's DB-shaped `OrderWithDetails`.
 *
 * Production status, internal notes and status history are dashboard-owned and
 * don't exist in Shopify, so they come back empty here and get merged in from
 * their own stores. Every consumer already treats production_status as nullable.
 */
export function mapOrder(node: ShopifyOrderNode, syncedAt: string): OrderWithDetails {
	return {
		id: node.id,
		order_number: node.name,
		created_at: node.createdAt,
		customer_name: customerName(node),
		customer_email: node.email,
		// Order-level phone is frequently null even when an address carries one.
		customer_phone: node.phone ?? node.shippingAddress?.phone ?? node.billingAddress?.phone ?? null,
		financial_status: node.displayFinancialStatus,
		fulfillment_status: node.displayFulfillmentStatus,
		shipping_method: node.shippingLines.edges[0]?.node.title ?? null,
		subtotal: money(node.subtotalPriceSet),
		total_tax: money(node.totalTaxSet),
		total_discounts: money(node.totalDiscountsSet),
		total_price: money(node.totalPriceSet),
		currency: node.totalPriceSet?.shopMoney.currencyCode ?? "USD",
		note: node.note,
		tags: node.tags,
		shipping_address: mapShippingAddress(node.shippingAddress),
		synced_at: syncedAt,
		line_items: node.lineItems.edges.map((edge) => mapLineItem(node.id, edge.node, syncedAt)),
		production_status: null,
		internal_notes: [],
		status_history: [],
	};
}

export async function fetchOrders({ first = 50, after = null, query = null }: FetchOrdersOptions = {}): Promise<FetchOrdersResult> {
	const { data } = await shopifyGraphQL<OrdersQueryResult>(ORDERS_QUERY, { first, after, query });
	const syncedAt = new Date().toISOString();

	return {
		orders: data.orders.edges.map((edge) => mapOrder(edge.node, syncedAt)),
		pageInfo: data.orders.pageInfo,
	};
}

