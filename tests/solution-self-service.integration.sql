\set ON_ERROR_STOP on
begin;
create temp table baseline as select md5(string_agg(row_to_json(p)::text,',' order by source_key)) fingerprint from public.product_catalog p;
create function pg_temp.assert(p_ok boolean,p_message text) returns void language plpgsql as $$ begin if p_ok is distinct from true then raise exception '%',p_message; end if; end $$;

set local role anon;
do $$ begin
  begin perform draft from public.product_solution_guides; raise exception 'anon read leaked'; exception when insufficient_privilege then null; end;
  begin perform public.admin_save_solution_guide('solution-a',0,'save','{}'); raise exception 'anon write allowed'; exception when insufficient_privilege then null; end;
end $$;
reset role;

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","app_metadata":{}}',true);
select pg_temp.assert((select count(*) = 0 from public.product_solution_guides),'ordinary user read leaked');
do $$ begin
  begin perform public.admin_save_solution_guide('solution-a',0,'save','{}'); raise exception 'ordinary user write allowed'; exception when insufficient_privilege then null; end;
end $$;

select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","app_metadata":{"role":"admin"}}',true);
select public.admin_save_solution_guide('solution-a',0,'save','{"title":"Guia A","introduction":"Introdução","youtubeId":null,"steps":["Passo aprovado"],"questions":[]}');
select pg_temp.assert((select published is null and revision = 1 from public.product_solution_guides where product_source_key='solution-a'),'draft became public');
select public.admin_save_solution_guide('solution-a',1,'publish','{"title":"Guia A","introduction":"Introdução","youtubeId":null,"steps":["Passo aprovado"],"questions":[]}');
select public.admin_save_solution_guide('solution-a',2,'save','{"title":"Rascunho B","introduction":"","youtubeId":null,"steps":["Passo novo"],"questions":[]}');
select pg_temp.assert((select published->>'title'='Guia A' and draft->>'title'='Rascunho B' and revision=3 from public.product_solution_guides where product_source_key='solution-a'),'draft overwrote publication');
do $$ begin
  begin perform public.admin_save_solution_guide('solution-a',2,'save','{"title":"Stale","introduction":"","youtubeId":null,"steps":[],"questions":[]}'); raise exception 'stale save allowed'; exception when serialization_failure then null; end;
  begin perform public.admin_save_solution_guide('solution-a',3,'publish','{"title":"Not saved","introduction":"","youtubeId":null,"steps":["step"],"questions":[]}'); raise exception 'unsaved publish allowed'; exception when serialization_failure then null; end;
  begin perform public.admin_save_solution_guide('solution-b',0,'save','{"title":"<script>","introduction":"","youtubeId":null,"steps":[],"questions":[]}'); raise exception 'HTML accepted'; exception when invalid_parameter_value then null; end;
  begin insert into public.product_solution_guides(product_source_key,draft) values ('solution-b','{"title":"X"}'); raise exception 'partial invalid JSON accepted'; exception when check_violation then null; end;
end $$;
select public.admin_save_solution_guide('solution-b',0,'save','{"title":"","introduction":"","youtubeId":null,"steps":[],"questions":[]}');
do $$ begin
  begin perform public.admin_save_solution_guide('solution-b',1,'publish','{"title":"","introduction":"","youtubeId":null,"steps":[],"questions":[]}'); raise exception 'empty guide published'; exception when invalid_parameter_value then null; end;
end $$;
select public.admin_save_solution_guide('solution-a',3,'unpublish','{"title":"Rascunho B","introduction":"","youtubeId":null,"steps":["Passo novo"],"questions":[]}');
select pg_temp.assert((select published is null and published_at is null and revision=4 from public.product_solution_guides where product_source_key='solution-a'),'withdraw failed');
select pg_temp.assert((select count(*)=3 from public.product_solution_guide_revisions where product_source_key='solution-a'),'history missing');

select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","app_metadata":{}}',true);
select pg_temp.assert((select count(*)=0 from public.product_solution_guides),'private drafts leaked after creation');
select pg_temp.assert((select count(*)=0 from public.product_solution_guide_revisions),'private revisions leaked');
reset role;
select pg_temp.assert((select status='paid' from public.commerce_orders limit 1),'commerce order changed');
select pg_temp.assert((select md5(string_agg(row_to_json(p)::text,',' order by source_key)) from public.product_catalog p)=(select fingerprint from baseline),'catalog changed');
select pg_temp.assert(not has_table_privilege('anon','public.product_solution_guides','select'),'anon has guide grant');
select pg_temp.assert(not has_table_privilege('authenticated','public.product_solution_guides','delete'),'guide deletion granted');
select pg_temp.assert(has_table_privilege('service_role','public.product_solution_guides','select'),'server cannot read published guide');
select pg_temp.assert(not has_function_privilege('anon','public.admin_save_solution_guide(text,integer,text,jsonb)','execute'),'anonymous function grant');
rollback;
select 'solution self-service: all SQL assertions passed' as result;
