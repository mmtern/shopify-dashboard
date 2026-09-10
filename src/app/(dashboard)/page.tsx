import { getMockStaff } from "@/lib/mock-data";
import { fetchOrders } from "@/lib/shopify/orders";
import { OrdersTable } from "@/components/orders/orders-table";
import { Badge } from "@/components/ui/badge";
import { getDictionary } from "@/lib/i18n/server";
import type { OrderWithDetails } from "@/lib/types";

// Orders change constantly; never serve a build-time snapshot.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
	// Staff is dashboard-owned and still unimplemented, so it stays mocked.
	const staff = getMockStaff();
	const t = await getDictionary();

	let orders: OrderWithDetails[] = [];
	let error: string | null = null;

	try {
		({ orders } = await fetchOrders({ first: 50 }));
	} catch (e) {
		error = e instanceof Error ? e.message : String(e);
		console.error("Dashboard orders fetch failed:", e);
	}

	return (
		<div className='flex flex-col gap-6'>
			<div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
				<div>
					<div className='flex items-center gap-3'>
						<h1 className='text-3xl font-bold tracking-tight'>{t.ordersTitle}</h1>
						<Badge variant='secondary' className='text-sm font-medium'>
							{orders.length}
						</Badge>
					</div>
					<p className='text-muted-foreground mt-1'>{t.ordersDesc}</p>
				</div>
			</div>

			{error ? (
				<div className='rounded-lg border border-destructive/30 bg-destructive/10 p-6 space-y-2'>
					<h2 className='font-semibold text-destructive'>Couldn&apos;t load orders from Shopify</h2>
					<p className='text-sm text-muted-foreground wrap-break-word'>{error}</p>
				</div>
			) : (
				<OrdersTable data={orders} staffList={staff} />
			)}
		</div>
	);
}
