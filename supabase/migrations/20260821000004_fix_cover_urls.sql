-- Fix broken Unsplash cover URLs for three demo animals
UPDATE public.animals SET cover_image_url =
  'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=800&h=800&fit=crop'
WHERE id = 'b0000000-0000-4000-8000-000000000004'; -- Nala

UPDATE public.animals SET cover_image_url =
  'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&h=800&fit=crop'
WHERE id = 'b0000000-0000-4000-8000-000000000012'; -- Bantay

UPDATE public.animals SET cover_image_url =
  'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=800&h=800&fit=crop'
WHERE id = 'b0000000-0000-4000-8000-000000000021'; -- Canela
