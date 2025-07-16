-- Create the "stocks" table
CREATE TABLE stocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    symbol TEXT NOT NULL,
    name TEXT NOT NULL,
    last_added_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE (user_id, symbol) -- Ensure a user can only add a stock once
);

-- Enable Row Level Security (RLS) for the "stocks" table
ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own stocks
CREATE POLICY "Users can view their own stocks" ON stocks
FOR SELECT USING (auth.uid() = user_id);

-- Policy for users to insert their own stocks
CREATE POLICY "Users can insert their own stocks" ON stocks
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own stocks
CREATE POLICY "Users can update their own stocks" ON stocks
FOR UPDATE USING (auth.uid() = user_id);

-- Policy for users to delete their own stocks
CREATE POLICY "Users can delete their own stocks" ON stocks
FOR DELETE USING (auth.uid() = user_id);

-- Create the "notes" table
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    stock_symbol TEXT NOT NULL, -- Link to stock by symbol, not ID, for flexibility
    title TEXT NOT NULL,
    source TEXT,
    trend TEXT NOT NULL, -- e.g., 'buy', 'sell', 'hold'
    content TEXT,
    note_date DATE NOT NULL, -- Date associated with the note (for chart plotting)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security (RLS) for the "notes" table
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own notes
CREATE POLICY "Users can view their own notes" ON notes
FOR SELECT USING (auth.uid() = user_id);

-- Policy for users to insert their own notes
CREATE POLICY "Users can insert their own notes" ON notes
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own notes
CREATE POLICY "Users can update their own notes" ON notes
FOR UPDATE USING (auth.uid() = user_id);

-- Policy for users to delete their own notes
CREATE POLICY "Users can delete their own notes" ON notes
FOR DELETE USING (auth.uid() = user_id);

-- Create a function to update the 'updated_at' column automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for 'stocks' and 'notes' tables
CREATE TRIGGER update_stocks_updated_at
BEFORE UPDATE ON stocks
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at
BEFORE UPDATE ON notes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
