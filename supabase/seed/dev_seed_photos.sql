-- Optional: attaches two real Fat Bear Week comparison photos (last year's,
-- from explore.org's public site) to Test Bear 1 and Test Bear 8 in the dev
-- seed bracket, so photo sizing/layout can be checked against real images
-- instead of placeholders. Run after dev_seed.sql. Safe to re-run.

update public.contestants
set image_url = 'https://media.explore.org/documents/26-1758557305581.png'
where competition_id = (select id from public.competitions where slug = 'test-bracket')
  and seed = 1;

update public.contestants
set image_url = 'https://media.explore.org/documents/32chunk-1758560671158.png'
where competition_id = (select id from public.competitions where slug = 'test-bracket')
  and seed = 8;
