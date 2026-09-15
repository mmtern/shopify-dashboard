// src/lib

// Database types
export interface Staff {
	id: string;
	username: string;
	display_name: string | null;
	role: "admin" | "staff";
	created_at: string;
}

export interface Order {
	id: string;
	order_number: string;
	created_at: string;
	customer_name: string | null;
	customer_email: string | null;
	customer_phone: string | null;
	financial_status: string | null;
	fulfillment_status: string | null;
	shipping_method: string | null;
	subtotal: number | null;
	total_tax: number | null;
	total_discounts: number | null;
	total_price: number | null;
	currency: string;
	note: string | null;
	tags: string[];
	shipping_address: ShippingAddress | null;
	synced_at: string;
}

export interface ShippingAddress {
	address1: string | null;
	address2: string | null;
	city: string | null;
	province: string | null;
	country: string | null;
	zip: string | null;
	phone: string | null;
}

export interface LineItem {
	id: string;
	order_id: string;
	title: string;
	variant_title: string | null;
	sku: string | null;
	quantity: number;
	unit_price: number | null;
	discounted_price: number | null;
	total_discount: number | null;
	tax_lines: TaxLine[] | null;
	custom_attributes: CustomAttribute[] | null;
	image_url: string | null;
	synced_at: string;
}

export interface TaxLine {
	title: string;
	rate: number;
	amount: number;
}

export interface CustomAttribute {
	key: string;
	value: string;
}

export interface ProductionStatus {
	id: string;
	order_id: string;
	stage: string;
	stage_updated_at: string | null;
	assigned_staff_id: string | null;
	created_at: string;
	updated_at: string;
}

export interface InternalNote {
	id: string;
	order_id: string;
	staff_id: string;
	content: string;
	created_at: string;
	updated_at: string;
	staff?: Staff;
}

export interface StatusHistoryEntry {
	id: string;
	order_id: string;
	staff_id: string;
	status_field: string;
	old_value: string;
	new_value: string;
	changed_at: string;
	staff?: Staff;
}

// Production file management types
export type FileType = 'design' | 'shipping_label' | 'other';
export type UploadStatus = 'pending' | 'uploading' | 'completed' | 'failed';

export interface ProductionJob {
	id: string;
	order_id: string;
	production_date: string | null;
	queue_number: number | null;
	include_sample: boolean;
	is_active: boolean;
	status: 'preparing' | 'ready';
	preparation_started_by: string | null;
	preparation_started_at: string | null;
	completed_by: string | null;
	completed_at: string | null;
	created_at: string;
	updated_at: string;
	staff?: Pick<Staff, 'username' | 'display_name'> | null;
}

export interface OrderFile {
	id: string;
	order_id: string;
	production_job_id: string;
	file_type: FileType;
	original_filename: string | null;
	generated_filename: string | null;
	design_length_inches: number | null;
	file_sequence: number | null;
	storage_provider: string | null;
	storage_key: string | null;
	mime_type: string | null;
	file_size_bytes: number | null;
	upload_status: UploadStatus;
	uploaded_by: string | null;
	created_at: string;
	updated_at: string;
	completed_at: string | null;
	version: number;
	is_active: boolean;
}

// Combined order with all relations
export interface OrderWithDetails extends Order {
	line_items: LineItem[];
	production_status: ProductionStatus | null;
	internal_notes: InternalNote[];
	status_history: StatusHistoryEntry[];
	production_job: ProductionJob | null;
	order_files: OrderFile[];
}

// Production status field names (for iteration)
export const PRODUCTION_STATUSES = [
	{ key: "new_order", label: "New Order", color: "bg-slate-400" },
	{ key: "ready_for_print", label: "Ready for Print", color: "bg-violet-400" },
	{ key: "printing", label: "Printing", color: "bg-indigo-400" },
	{ key: "printed", label: "Printed", color: "bg-blue-400" },
	{ key: "ready_for_pickup", label: "Ready for Pickup", color: "bg-teal-400" },
	{ key: "ready_to_ship", label: "Ready to Ship", color: "bg-green-400" },
	{ key: "shipped", label: "Shipped", color: "bg-emerald-500" },
] as const;

export type ProductionStatusKey = (typeof PRODUCTION_STATUSES)[number]["key"];

// URL-type custom attribute keys
export const URL_ATTRIBUTE_KEYS = [
	"Preview",
	"Edit",
	"_Admin Edit",
	"_Print Ready File",
	"upload",
	"thumbnail",
] as const;

// Metadata custom attribute keys
export const META_ATTRIBUTE_KEYS = ["_Has Transparency", "_Actual Height"] as const;

// Shopify Admin API types (camelCase — these mirror the GraphQL shape, not the DB)
export interface ShopifyShop {
	id: string;
	name: string;
	email: string | null;
	contactEmail: string | null;
	myshopifyDomain: string;
	url: string;
	primaryDomain: {
		url: string;
		host: string;
		sslEnabled: boolean;
	};
	currencyCode: string;
	currencyFormats: {
		moneyFormat: string;
		moneyWithCurrencyFormat: string;
	};
	ianaTimezone: string;
	timezoneAbbreviation: string;
	weightUnit: string;
	unitSystem: string;
	taxesIncluded: boolean | null;
	createdAt: string;
	plan: {
		displayName: string;
		shopifyPlus: boolean;
		partnerDevelopment: boolean;
	};
	shipsToCountries: string[];
	enabledPresentmentCurrencies: string[];
}
