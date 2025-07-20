create
extension if not exists "pgroonga" with schema "extensions";


CREATE INDEX pgroonga_dishes_search_idx ON public.dishes USING pgroonga (name) WITH (normalizers='NormalizerNFKC150("unify_alphabet", true)', tokenizer='TokenNgram("n", 2, "unify_alphabet", true, "loose_symbol", true)');

set
check_function_bodies = off;

CREATE
OR REPLACE FUNCTION public.search_dishes_pgroonga(search_query text, user_collection_id bigint DEFAULT NULL::bigint, limit_count integer DEFAULT 25)
 RETURNS TABLE(id bigint, name text, icon text, proteins real, fats real, carbs real, calories real, "defaultPortion" real, "hasIngredients" boolean, "cookedWeight" real, "updatedAt" timestamp with time zone, "createdAt" timestamp with time zone, "collectionId" bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
processed_query text;
BEGIN
  -- Обработка запроса для добавления wildcard к коротким словам
SELECT string_agg(
               CASE
                   WHEN length(trim(word)) > 0 AND length(trim(word)) < 5
                       THEN trim(word) || '*'
                   ELSE trim(word)
                   END,
               ' '
       )
INTO processed_query
FROM unnest(string_to_array(search_query, ' ')) AS word;

RETURN QUERY
SELECT d.id,
       d.name,
       d.icon,
       d.proteins,
       d.fats,
       d.carbs,
       d.calories,
       d."defaultPortion",
       d."hasIngredients",
       d."cookedWeight",
       d."updatedAt",
       d."createdAt",
       d."collectionId"
FROM dishes d
WHERE d.deleted = false
  AND (user_collection_id IS NULL OR d."collectionId" IN (1, user_collection_id))
  AND d.name &@~ processed_query
ORDER BY
    d."updatedAt" DESC
    LIMIT limit_count;
END;
$function$
;


