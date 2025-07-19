ALTER TABLE public.stocks
ADD COLUMN current_price numeric,
ADD COLUMN price_change numeric,
ADD COLUMN price_change_percent numeric,
ADD COLUMN last_fetched_price_date date;

-- Optional: Add an index for faster lookups if needed
-- CREATE INDEX idx_stocks_last_fetched_date ON public.stocks (last_fetched_price_date);
