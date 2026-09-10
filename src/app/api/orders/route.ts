// src/app/api/orders/route.ts

import { NextRequest, NextResponse } from "next/server";
import { fetchOrders } from "@/lib/shopify/orders";

const MAX_PAGE_SIZE = 250;

export async function GET(request: NextRequest) {
	const params = request.nextUrl.searchParams;

	const requested = Number.parseInt(params.get("limit") ?? "", 10);
	// Shopify rejects `first` above 250 outright.
	const first = Number.isFinite(requested) ? Math.min(Math.max(requested, 1), MAX_PAGE_SIZE) : 50;

	try {
		const { orders, pageInfo } = await fetchOrders({
			first,
			after: params.get("cursor"),
			query: params.get("query"),
		});
		return NextResponse.json({ orders, pageInfo });
	} catch (error) {
		console.error("Orders fetch error:", error);
		return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
	}
}

