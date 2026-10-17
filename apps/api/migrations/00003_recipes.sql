-- +goose Up
ALTER TABLE app.dishes
    ADD COLUMN default_portion double precision CHECK (default_portion > 0 AND default_portion < 'Infinity'::double precision),
    ADD COLUMN cooked_weight double precision CHECK (cooked_weight > 0 AND cooked_weight < 'Infinity'::double precision),
    ADD COLUMN deleted_at timestamptz;
CREATE INDEX dishes_active_name_id_idx ON app.dishes(name, id) WHERE deleted_at IS NULL;

DROP POLICY readable_dish ON app.dishes;
CREATE POLICY readable_dish ON app.dishes FOR SELECT TO fatbook_user
    USING (deleted_at IS NULL AND (space_id IS NULL OR space_id IN (SELECT space_id FROM app.memberships)));

CREATE TABLE app.ingredients (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY CHECK (id BETWEEN 1 AND 9007199254740991),
    recipe_id bigint NOT NULL REFERENCES app.dishes(id),
    dish_id bigint NOT NULL REFERENCES app.dishes(id),
    portion double precision NOT NULL CHECK (portion > 0 AND portion < 'Infinity'::double precision),
    source_name text NOT NULL CHECK (length(btrim(source_name)) BETWEEN 1 AND 100),
    source_icon text,
    source_proteins double precision NOT NULL CHECK (source_proteins >= 0 AND source_proteins < 'Infinity'::double precision),
    source_fats double precision NOT NULL CHECK (source_fats >= 0 AND source_fats < 'Infinity'::double precision),
    source_carbs double precision NOT NULL CHECK (source_carbs >= 0 AND source_carbs < 'Infinity'::double precision),
    source_calories double precision NOT NULL CHECK (source_calories >= 0 AND source_calories < 'Infinity'::double precision),
    proteins double precision NOT NULL CHECK (proteins >= 0 AND proteins < 'Infinity'::double precision),
    fats double precision NOT NULL CHECK (fats >= 0 AND fats < 'Infinity'::double precision),
    carbs double precision NOT NULL CHECK (carbs >= 0 AND carbs < 'Infinity'::double precision),
    calories double precision NOT NULL CHECK (calories >= 0 AND calories < 'Infinity'::double precision),
    UNIQUE (recipe_id, dish_id),
    CHECK (recipe_id <> dish_id)
);
CREATE INDEX ingredients_dish_id_idx ON app.ingredients(dish_id);
ALTER TABLE app.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.ingredients FORCE ROW LEVEL SECURITY;
CREATE POLICY readable_ingredient ON app.ingredients FOR SELECT TO fatbook_user
    USING (EXISTS (SELECT 1 FROM app.dishes WHERE id = recipe_id));
CREATE POLICY insert_own_ingredient ON app.ingredients FOR INSERT TO fatbook_user
    WITH CHECK (
        EXISTS (SELECT 1 FROM app.dishes WHERE id = recipe_id AND cooked_weight IS NOT NULL AND space_id IN (SELECT space_id FROM app.memberships))
        AND EXISTS (SELECT 1 FROM app.dishes WHERE id = dish_id AND cooked_weight IS NULL)
    );
CREATE POLICY update_own_ingredient ON app.ingredients FOR UPDATE TO fatbook_user
    USING (EXISTS (SELECT 1 FROM app.dishes WHERE id = recipe_id AND space_id IN (SELECT space_id FROM app.memberships)))
    WITH CHECK (
        EXISTS (SELECT 1 FROM app.dishes WHERE id = recipe_id AND cooked_weight IS NOT NULL AND space_id IN (SELECT space_id FROM app.memberships))
        AND EXISTS (SELECT 1 FROM app.dishes WHERE id = dish_id AND cooked_weight IS NULL)
    );
CREATE POLICY delete_own_ingredient ON app.ingredients FOR DELETE TO fatbook_user
    USING (EXISTS (SELECT 1 FROM app.dishes WHERE id = recipe_id AND space_id IN (SELECT space_id FROM app.memberships)));
GRANT SELECT, INSERT, UPDATE, DELETE ON app.ingredients TO fatbook_user;
GRANT USAGE ON SEQUENCE app.ingredients_id_seq TO fatbook_user;

CREATE TABLE app.creation_requests (
    user_id uuid NOT NULL REFERENCES app.users(id),
    operation text NOT NULL CHECK (operation = 'create_recipe'),
    request_id uuid NOT NULL,
    request_body jsonb NOT NULL,
    response_body jsonb NOT NULL,
    PRIMARY KEY (user_id, operation, request_id)
);
ALTER TABLE app.creation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.creation_requests FORCE ROW LEVEL SECURITY;
CREATE POLICY own_creation_request ON app.creation_requests TO fatbook_user
    USING (user_id = (SELECT app.current_user_id()))
    WITH CHECK (user_id = (SELECT app.current_user_id()));
GRANT SELECT, INSERT ON app.creation_requests TO fatbook_user;

-- +goose Down
DROP TABLE app.creation_requests, app.ingredients;
DROP POLICY readable_dish ON app.dishes;
CREATE POLICY readable_dish ON app.dishes FOR SELECT TO fatbook_user
    USING (space_id IS NULL OR space_id IN (SELECT space_id FROM app.memberships));
DROP INDEX app.dishes_active_name_id_idx;
ALTER TABLE app.dishes DROP COLUMN deleted_at, DROP COLUMN cooked_weight, DROP COLUMN default_portion;
