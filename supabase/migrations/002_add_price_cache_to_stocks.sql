-- Add new columns for price caching to the 'stocks' table
ALTER TABLE stocks
ADD COLUMN current_price NUMERIC(10, 2),
ADD COLUMN price_change NUMERIC(10, 2),
ADD COLUMN price_change_percent NUMERIC(5, 2),
ADD COLUMN last_fetched_price_date DATE;

-- Optional: Create an index on user_id and symbol for faster lookups
CREATE INDEX idx_stocks_user_symbol ON stocks (user_id, symbol);
