-- Create user_profiles table
CREATE TABLE public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email text UNIQUE NOT NULL,
  registered_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Set up Row Level Security (RLS) for user_profiles table
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own profile
CREATE POLICY "Users can view their own profile." ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy for users to insert their own profile (during registration callback)
CREATE POLICY "Users can insert their own profile." ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy for users to update their own profile (if needed in the future)
CREATE POLICY "Users can update their own profile." ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Policy for users to delete their own profile (if needed, e.g., account deletion)
CREATE POLICY "Users can delete their own profile." ON public.user_profiles
  FOR DELETE USING (auth.uid() = id);

-- Enable automatic update of 'updated_at' column
CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_profiles_updated_at_trigger
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
