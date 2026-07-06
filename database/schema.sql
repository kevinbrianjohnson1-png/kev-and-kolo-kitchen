-- Kev & Kolo Kitchen / Project Pantry schema
-- Metadata-only cookbook companion. No copyrighted recipe methods stored.

create table cookbooks (
  id text primary key,
  title text not null,
  subtitle text,
  authors jsonb,
  format text,
  source_type text,
  reference_note text,
  copyright_policy text
);

create table recipes (
  id text primary key,
  cookbook_id text references cookbooks(id),
  title text not null,
  source_type text not null default 'cookbook_reference',
  meal_type text,
  primary_protein text,
  cuisine text,
  spice_level text,
  display_reference text,
  description text,
  confidence jsonb
);

create table ingredients (
  id text primary key,
  name text not null unique,
  category text
);

create table recipe_ingredients (
  recipe_id text references recipes(id),
  ingredient_id text references ingredients(id),
  source text,
  primary key (recipe_id, ingredient_id)
);

create table tags (
  id text primary key,
  name text not null unique,
  category text
);

create table recipe_tags (
  recipe_id text references recipes(id),
  tag_id text references tags(id),
  source text,
  primary key (recipe_id, tag_id)
);

create table user_notes (
  id uuid primary key default gen_random_uuid(),
  recipe_id text references recipes(id),
  user_name text,
  rating int check (rating between 1 and 5),
  note text,
  created_at timestamptz default now()
);
