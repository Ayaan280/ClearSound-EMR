/*
  # Create Findify App Tables

  ## Summary
  Creates all tables needed for the Findify AI shopping assistant app.

  ## New Tables

  1. `profiles`
     - Stores user profile data linked to auth.users
     - `id` - UUID matching auth.users id
     - `full_name` - User's display name
     - `email` - User's email
     - `created_at` - Timestamp

  2. `favorite_products`
     - Stores products users have saved/favorited
     - `id` - UUID primary key
     - `user_id` - References auth.users
     - `product_name` - Name of the product
     - `price` - Product price string
     - `description` - Product description
     - `image_url` - Product image URL
     - `product_url` - Link to buy the product
     - `rating` - Numeric rating (1-5)
     - `created_at` - Timestamp

  3. `search_history`
     - Stores past AI shopping searches
     - `id` - UUID primary key
     - `user_id` - References auth.users
     - `product_type` - What the user searched for
     - `answers` - JSONB object with collected preferences
     - `recommended_product` - JSONB of the top recommended product
     - `budget_matched` - Whether the recommendation was within budget
     - `messages` - JSONB array of the full chat conversation
     - `created_at` - Timestamp

  ## Security
  - RLS enabled on all tables
  - Users can only access their own data
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text DEFAULT '',
  email text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE TABLE IF NOT EXISTS favorite_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_name text NOT NULL DEFAULT '',
  price text DEFAULT '',
  description text DEFAULT '',
  image_url text DEFAULT '',
  product_url text NOT NULL DEFAULT '',
  rating numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE favorite_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
  ON favorite_products FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON favorite_products FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON favorite_products FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS search_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_type text NOT NULL DEFAULT '',
  answers jsonb DEFAULT '{}',
  recommended_product jsonb DEFAULT NULL,
  budget_matched boolean DEFAULT true,
  messages jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own search history"
  ON search_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own search history"
  ON search_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own search history"
  ON search_history FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_favorite_products_user_id ON favorite_products(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_products_product_name ON favorite_products(user_id, product_name);
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON search_history(user_id, created_at DESC);
