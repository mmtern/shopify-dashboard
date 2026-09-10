import { fetchOrders } from "@/lib/shopify/orders";
import { OrdersTable } from "@/components/orders/orders-table";
import { Badge } from "@/components/ui/badge";
import { getDictionary } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import type { OrderWithDetails } from "@/lib/types";

// Orders change constantly; never serve a build-time snapshot.
export const dynamic = "force-dynamic";

interface DashboardPageProps {
	searchParams: Promise<{ cursor?: string; page?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
	const t = await getDictionary();
	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();
	const username = (user?.user_metadata?.username as string) || user?.email?.split('@')[0] || 'User';
	const params = await searchParams;

	const cursor = params.cursor ?? null;
	const currentPage = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

	let orders: OrderWithDetails[] = [];
	let pageInfo = { hasNextPage: false, endCursor: null as string | null };
	let error: string | null = null;
	let stageStaff: Record<string, Record<string, string>> = {};
	let staffList: any[] = [];

	try {
        // Fetch staff from Supabase
        const { data: staffData } = await supabase.from('staff').select('*').order('display_name');
        staffList = staffData || [];

        // Fetch Shopify orders
		const result = await fetchOrders({ first: 50, after: cursor });
		orders = result.orders;
		pageInfo = result.pageInfo;

        const orderIds = orders.map(o => o.id);

        if (orderIds.length > 0) {
            // Fetch production statuses
            const { data: statuses } = await supabase
                .from('production_status')
                .select('*')
                .in('order_id', orderIds);

            // Fetch internal notes with staff details
            const { data: notes } = await supabase
                .from('internal_notes')
                .select('*, staff (username, display_name)')
                .in('order_id', orderIds)
                .order('created_at', { ascending: false });

            // Fetch status history with staff details
            const { data: history } = await supabase
                .from('status_history')
                .select('*, staff (username, display_name)')
                .in('order_id', orderIds)
                .order('changed_at', { ascending: true }); // ASC so latest overwrites earlier
            
            // Map Supabase data to orders
            for (const order of orders) {
                order.production_status = statuses?.find(s => s.order_id === order.id) || null;
                order.internal_notes = notes?.filter(n => n.order_id === order.id) || [];
                order.status_history = history?.filter(h => h.order_id === order.id) || [];

                // Compute stageStaff from history
                stageStaff[order.id] = {};
                for (const entry of order.status_history) {
                    if (entry.status_field === 'stage') {
                         stageStaff[order.id][entry.new_value] = entry.staff?.display_name || entry.staff?.username || 'User';
                    }
                }
            }
        }
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
				<OrdersTable
					data={orders}
					staffList={staffList}
					pageInfo={pageInfo}
					currentPage={currentPage}
					username={username}
					initialStageStaff={stageStaff}
				/>
			)}
		</div>
	);
}
