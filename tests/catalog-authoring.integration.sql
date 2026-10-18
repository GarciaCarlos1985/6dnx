set request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","app_metadata":{"role":"admin"}}';
set role authenticated;
insert into public.product_catalog(id,source_key,slug,title,category,tagline,description,image,variants,publication_state,catalog_order)
values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','legacy-product','legacy-product','Produto original','Software','Apresentação aprovada','Conteúdo original.','/products/card-art/dayz-6dnx.webp','[{"name":"Plano aprovado","priceBRL":79.9}]','published',4);
reset role;
create table lab_legacy_snapshot as select to_jsonb(product_catalog) as content from public.product_catalog;
create table lab_orders_snapshot as select * from public.commerce_orders;
set role authenticated;
insert into public.product_catalog(id,source_key,slug,title,category,tagline,image)
values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','admin-bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','new-product','Novo produto','Software','Novo produto','/products/product-placeholder.svg');
do $$ begin
  begin
    perform public.admin_publish_catalog_product('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',1);
    raise exception 'incomplete draft was published';
  exception when invalid_parameter_value then null; end;
  if (select publication_state <> 'draft' or revision <> 1 from public.product_catalog where slug='new-product') then raise exception 'failed publication changed the draft'; end if;
end $$;
update public.product_catalog set description='Descrição aprovada.',image='/products/card-art/dayz-6dnx.webp',variants='[{"name":"Plano aprovado","priceBRL":79.9}]' where slug='new-product';
do $$ begin
  begin
    perform public.admin_publish_catalog_product('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',1);
    raise exception 'stale revision was accepted';
  exception when serialization_failure then null; end;
  perform public.admin_publish_catalog_product('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',2);
  if (select publication_state <> 'published' or revision <> 3 or catalog_order <> 5 from public.product_catalog where slug='new-product') then raise exception 'publication not appended or versioned'; end if;
  if (select count(*) from public.product_catalog_revisions where product_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb') <> 2 then raise exception 'missing product history'; end if;
end $$;
insert into public.product_catalog(id,source_key,slug,title,category,tagline,description,image,variants)
select id, 'admin-'||id, 'draft-'||id, 'Produto de teste', 'Software', 'Apresentação de teste', 'Descrição aprovada.', '/products/card-art/dayz-6dnx.webp', '[{"name":"Plano aprovado","priceBRL":79.9}]'::jsonb
from unnest(array['cccccccc-cccc-4ccc-8ccc-cccccccccccc'::uuid,'dddddddd-dddd-4ddd-8ddd-dddddddddddd'::uuid,'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'::uuid]) as ids(id);
reset role;
set request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","user_metadata":{"role":"admin"},"app_metadata":{}}';
set role authenticated;
do $$ begin
  if (select count(*) from public.product_catalog) <> 2 then raise exception 'draft leaked to ordinary user'; end if;
  begin
    perform public.admin_publish_catalog_product('cccccccc-cccc-4ccc-8ccc-cccccccccccc',1);
    raise exception 'ordinary user published';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.product_catalog(source_key,slug,title,category,tagline,image) values ('forged','forged','Forjado','Software','Forjado','/icon.png');
    raise exception 'ordinary user created a product';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
set role anon;
do $$ begin
  if (select count(*) from public.product_catalog) <> 2 then raise exception 'anonymous user saw drafts'; end if;
  begin
    perform public.admin_publish_catalog_product('cccccccc-cccc-4ccc-8ccc-cccccccccccc',1);
    raise exception 'anonymous publication allowed';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
do $$ begin
  if (select prosecdef from pg_proc where oid='public.admin_publish_catalog_product(uuid,integer)'::regprocedure) then raise exception 'publication bypasses RLS'; end if;
  if has_function_privilege('anon','public.admin_publish_catalog_product(uuid,integer)','EXECUTE') or has_function_privilege('service_role','public.admin_publish_catalog_product(uuid,integer)','EXECUTE') then raise exception 'unexpected publication grant'; end if;
  if (select to_jsonb(product_catalog) from public.product_catalog where source_key='legacy-product') <> (select content from lab_legacy_snapshot) then raise exception 'legacy product modified'; end if;
  if exists((table public.commerce_orders except table lab_orders_snapshot) union all (table lab_orders_snapshot except table public.commerce_orders)) then raise exception 'commercial data modified'; end if;
end $$;
