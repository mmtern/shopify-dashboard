// src/app/api/shop/route.ts

import { NextResponse } from "next/server";
import { shopifyGraphQL } from "@/lib/shopify/client";
import { SHOP_QUERY } from "@/lib/shopify/queries";
import { ShopifyShop } from "@/lib/types";

export async function GET() {
	try {
		const { data } = await shopifyGraphQL<{ shop: ShopifyShop }>(SHOP_QUERY);
		return NextResponse.json({ shop: data.shop });
	} catch (error) {
		console.error("Shop fetch error:", error);
		return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
	}
}
