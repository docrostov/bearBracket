-- Attaches real explore.org "meet the bears" photos to all 12 Fat Bear
-- Week 2025 contestants (previously only 26 and 32 Chunk had one). Only
-- updates image_url, so it's safe to run against a bracket that already
-- has picks recorded — nothing else changes. Safe to re-run.

update public.contestants set image_url = v.image_url
from (values
  ('128 Jr.', 'https://media.explore.org/documents/128yearling-1758059452387.png'),
  ('609', 'https://media.explore.org/documents/609-1758737454490.png'),
  ('602', 'https://media.explore.org/documents/602-1758562266438.png'),
  ('503', 'https://media.explore.org/documents/503-1758560839893.png'),
  ('901', 'https://media.explore.org/documents/901-1758562371329.png'),
  ('32 Chunk', 'https://media.explore.org/documents/32chunk-1758560671158.png'),
  ('26', 'https://media.explore.org/documents/26-1758557305581.png'),
  ('909', 'https://media.explore.org/documents/909-1758562402990.png'),
  ('128 Grazer', 'https://media.explore.org/documents/128grazer-1758560774361.png'),
  ('99', 'https://media.explore.org/documents/99-1758560720167.png'),
  ('856', 'https://media.explore.org/documents/856-1758562333630.png'),
  ('910', 'https://media.explore.org/documents/910-1758562455268.png')
) as v(name, image_url)
where public.contestants.name = v.name
  and public.contestants.competition_id = (
    select id from public.competitions where slug = 'fat-bear-week-2025'
  );
