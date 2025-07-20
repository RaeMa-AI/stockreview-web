-- Create stocks table
CREATE TABLE public.stocks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  symbol text NOT NULL,
  name text NOT NULL,
  last_added_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE (user_id, symbol) -- Ensure a user can only add a stock once
);

ALTER TABLE public.stocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own stocks." ON public.stocks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stocks." ON public.stocks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stocks." ON public.stocks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stocks." ON public.stocks
  FOR DELETE USING (auth.uid() = user_id);

-- Create notes table
CREATE TABLE public.notes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stock_symbol text NOT NULL,
  title text NOT NULL,
  source text,
  trend text NOT NULL, -- 'hold', 'sell', 'buy'
  content text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  note_date date NOT NULL DEFAULT CURRENT_DATE -- For chart plotting
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notes." ON public.notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notes." ON public.notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes." ON public.notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes." ON public.notes
  FOR DELETE USING (auth.uid() = user_id);
