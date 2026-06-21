export interface ApiPriceItem {
  drink_id: string;
  pos_item_id?: string;
  name: string;
  volume?: string;
  unitCapacity?: number;
  base_price?: string;
  defaultSalePrice?: string;
  current_price: string;
  current_pct: string;
  min_pct: string;
  max_pct: string;
  is_fixed: boolean;
  last_bucket: string;
  updated_at: string;
}

export interface ApiPricesResponse {
  prices: ApiPriceItem[];
  settings_version: number;
  updated_at: string;
}

export interface ApiSaleItem {
  pos_item_id: string;
  drink_id: string;
  quantity: number;
  size_id?: string;
}

export interface ApiSaleRequest extends ApiSaleItem {
  sold_at: string;
  source: string;
}

export interface ApiSaleBatchItem {
  pos_item_id: string;
  size_id: string;
  drink_id: string;
  quantity: number;
}

export interface ApiSaleBatchRequest {
  items: ApiSaleBatchItem[];
  sold_at?: string | null;
  source: string;
}

export interface ApiAdminSettings {
  id: number;
  version: number;
  price_update_interval_sec: number;
  sales_analysis_window_sec: number;
  neutral_zone_percent: string;
  max_step_up_pct: string;
  max_step_down_pct: string;
  max_step_to_center_pct: string;
  default_sensitivity: string;
  default_min_pct: string;
  default_max_pct: string;
  price_rounding_step: string;
  fixed_items_affect_market: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiAdminSettingsUpdate {
  price_update_interval_sec: number;
  sales_analysis_window_sec: number;
  neutral_zone_percent: number;
  max_step_up_pct: number;
  max_step_down_pct: number;
  max_step_to_center_pct: number;
  default_sensitivity: number;
  default_min_pct: number;
  default_max_pct: number;
  price_rounding_step: number;
  fixed_items_affect_market: boolean;
}

export interface ApiAdminSettingsHistoryItem {
  id: number;
  version: number;
  created_at: string;
}

export interface ApiAdminRecalcResponse {
  recalculated: number;
  market_avg: string;
  neutral_band_low: string;
  neutral_band_high: string;
}
