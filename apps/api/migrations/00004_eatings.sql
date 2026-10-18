-- +goose Up
ALTER TABLE app.creation_requests DROP CONSTRAINT creation_requests_operation_check;
ALTER TABLE app.creation_requests ADD CHECK (operation IN ('create_recipe', 'create_eating'));

CREATE TABLE app.eatings (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY CHECK (id BETWEEN 1 AND 9007199254740991),
    user_id uuid NOT NULL REFERENCES app.users(id),
    dish_id bigint REFERENCES app.dishes(id) ON DELETE SET NULL,
    day date NOT NULL CHECK (day BETWEEN DATE '0001-01-01' AND DATE '9999-12-31'),
    meal text NOT NULL CHECK (meal IN ('breakfast', 'lunch', 'dinner', 'snack')),
    portion double precision NOT NULL CHECK (portion > 0 AND portion < 'Infinity'::double precision),
    dish_name text NOT NULL CHECK (length(btrim(dish_name)) BETWEEN 1 AND 100),
    dish_icon text,
    dish_proteins double precision NOT NULL CHECK (dish_proteins >= 0 AND dish_proteins < 'Infinity'::double precision),
    dish_fats double precision NOT NULL CHECK (dish_fats >= 0 AND dish_fats < 'Infinity'::double precision),
    dish_carbs double precision NOT NULL CHECK (dish_carbs >= 0 AND dish_carbs < 'Infinity'::double precision),
    dish_calories double precision NOT NULL CHECK (dish_calories >= 0 AND dish_calories < 'Infinity'::double precision),
    proteins double precision NOT NULL CHECK (proteins >= 0 AND proteins < 'Infinity'::double precision),
    fats double precision NOT NULL CHECK (fats >= 0 AND fats < 'Infinity'::double precision),
    carbs double precision NOT NULL CHECK (carbs >= 0 AND carbs < 'Infinity'::double precision),
    calories double precision NOT NULL CHECK (calories >= 0 AND calories < 'Infinity'::double precision),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX eatings_user_day_id_idx ON app.eatings(user_id, day, id);
CREATE INDEX eatings_dish_id_idx ON app.eatings(dish_id);
ALTER TABLE app.eatings ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.eatings FORCE ROW LEVEL SECURITY;
CREATE POLICY read_own_eating ON app.eatings FOR SELECT TO fatbook_user
    USING (user_id = (SELECT app.current_user_id()));
CREATE POLICY insert_own_eating ON app.eatings FOR INSERT TO fatbook_user
    WITH CHECK (user_id = (SELECT app.current_user_id()) AND EXISTS (SELECT 1 FROM app.dishes WHERE id = dish_id));
-- Исправление веса остаётся доступным после удаления исходного рецепта.
-- Ссылка и владелец при UPDATE недоступны runtime-роли.
CREATE POLICY update_own_eating ON app.eatings FOR UPDATE TO fatbook_user
    USING (user_id = (SELECT app.current_user_id()))
    WITH CHECK (user_id = (SELECT app.current_user_id()));
CREATE POLICY delete_own_eating ON app.eatings FOR DELETE TO fatbook_user
    USING (user_id = (SELECT app.current_user_id()));
GRANT SELECT, INSERT, DELETE ON app.eatings TO fatbook_user;
GRANT UPDATE (portion, proteins, fats, carbs, calories, updated_at) ON app.eatings TO fatbook_user;
GRANT USAGE ON SEQUENCE app.eatings_id_seq TO fatbook_user;

-- +goose Down
DROP TABLE app.eatings;
DELETE FROM app.creation_requests WHERE operation = 'create_eating';
ALTER TABLE app.creation_requests DROP CONSTRAINT creation_requests_operation_check;
ALTER TABLE app.creation_requests ADD CHECK (operation = 'create_recipe');
