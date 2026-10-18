-- +goose Up
-- UPDATE проверяет SELECT-политику и для новой строки. Владелец читает свои
-- tombstones, чтобы выполнить мягкое удаление; API отбирает активные блюда.
-- Ссылки проверяют deleted_at независимо от фильтров HTTP.
DROP POLICY readable_dish ON app.dishes;
CREATE POLICY readable_dish ON app.dishes FOR SELECT TO fatbook_user
    USING ((space_id IS NULL AND deleted_at IS NULL) OR space_id IN (SELECT space_id FROM app.memberships));
DROP POLICY update_own_dish ON app.dishes;
CREATE POLICY update_own_dish ON app.dishes FOR UPDATE TO fatbook_user
    USING (deleted_at IS NULL AND space_id IN (SELECT space_id FROM app.memberships))
    WITH CHECK (space_id IN (SELECT space_id FROM app.memberships));
REVOKE DELETE ON app.dishes FROM fatbook_user;

DROP POLICY readable_ingredient ON app.ingredients;
CREATE POLICY readable_ingredient ON app.ingredients FOR SELECT TO fatbook_user
    USING (EXISTS (SELECT 1 FROM app.dishes WHERE id = recipe_id AND deleted_at IS NULL));
DROP POLICY insert_own_ingredient ON app.ingredients;
CREATE POLICY insert_own_ingredient ON app.ingredients FOR INSERT TO fatbook_user
    WITH CHECK (
        EXISTS (SELECT 1 FROM app.dishes WHERE id = recipe_id AND deleted_at IS NULL AND cooked_weight IS NOT NULL AND space_id IN (SELECT space_id FROM app.memberships))
        AND EXISTS (SELECT 1 FROM app.dishes WHERE id = dish_id AND deleted_at IS NULL AND cooked_weight IS NULL)
    );
DROP POLICY update_own_ingredient ON app.ingredients;
CREATE POLICY update_own_ingredient ON app.ingredients FOR UPDATE TO fatbook_user
    USING (EXISTS (SELECT 1 FROM app.dishes WHERE id = recipe_id AND deleted_at IS NULL AND space_id IN (SELECT space_id FROM app.memberships)))
    WITH CHECK (
        EXISTS (SELECT 1 FROM app.dishes WHERE id = recipe_id AND deleted_at IS NULL AND cooked_weight IS NOT NULL AND space_id IN (SELECT space_id FROM app.memberships))
        AND EXISTS (SELECT 1 FROM app.dishes WHERE id = dish_id AND deleted_at IS NULL AND cooked_weight IS NULL)
    );
DROP POLICY delete_own_ingredient ON app.ingredients;
CREATE POLICY delete_own_ingredient ON app.ingredients FOR DELETE TO fatbook_user
    USING (EXISTS (SELECT 1 FROM app.dishes WHERE id = recipe_id AND deleted_at IS NULL AND space_id IN (SELECT space_id FROM app.memberships)));
DROP POLICY insert_own_eating ON app.eatings;
CREATE POLICY insert_own_eating ON app.eatings FOR INSERT TO fatbook_user
    WITH CHECK (user_id = (SELECT app.current_user_id()) AND EXISTS (SELECT 1 FROM app.dishes WHERE id = dish_id AND deleted_at IS NULL));

-- +goose Down
DROP POLICY insert_own_eating ON app.eatings;
CREATE POLICY insert_own_eating ON app.eatings FOR INSERT TO fatbook_user
    WITH CHECK (user_id = (SELECT app.current_user_id()) AND EXISTS (SELECT 1 FROM app.dishes WHERE id = dish_id));
DROP POLICY delete_own_ingredient ON app.ingredients;
CREATE POLICY delete_own_ingredient ON app.ingredients FOR DELETE TO fatbook_user
    USING (EXISTS (SELECT 1 FROM app.dishes WHERE id = recipe_id AND space_id IN (SELECT space_id FROM app.memberships)));
DROP POLICY update_own_ingredient ON app.ingredients;
CREATE POLICY update_own_ingredient ON app.ingredients FOR UPDATE TO fatbook_user
    USING (EXISTS (SELECT 1 FROM app.dishes WHERE id = recipe_id AND space_id IN (SELECT space_id FROM app.memberships)))
    WITH CHECK (
        EXISTS (SELECT 1 FROM app.dishes WHERE id = recipe_id AND cooked_weight IS NOT NULL AND space_id IN (SELECT space_id FROM app.memberships))
        AND EXISTS (SELECT 1 FROM app.dishes WHERE id = dish_id AND cooked_weight IS NULL)
    );
DROP POLICY insert_own_ingredient ON app.ingredients;
CREATE POLICY insert_own_ingredient ON app.ingredients FOR INSERT TO fatbook_user
    WITH CHECK (
        EXISTS (SELECT 1 FROM app.dishes WHERE id = recipe_id AND cooked_weight IS NOT NULL AND space_id IN (SELECT space_id FROM app.memberships))
        AND EXISTS (SELECT 1 FROM app.dishes WHERE id = dish_id AND cooked_weight IS NULL)
    );
DROP POLICY readable_ingredient ON app.ingredients;
CREATE POLICY readable_ingredient ON app.ingredients FOR SELECT TO fatbook_user
    USING (EXISTS (SELECT 1 FROM app.dishes WHERE id = recipe_id));
GRANT DELETE ON app.dishes TO fatbook_user;
DROP POLICY update_own_dish ON app.dishes;
CREATE POLICY update_own_dish ON app.dishes FOR UPDATE TO fatbook_user
    USING (space_id IN (SELECT space_id FROM app.memberships))
    WITH CHECK (space_id IN (SELECT space_id FROM app.memberships));
DROP POLICY readable_dish ON app.dishes;
CREATE POLICY readable_dish ON app.dishes FOR SELECT TO fatbook_user
    USING (deleted_at IS NULL AND (space_id IS NULL OR space_id IN (SELECT space_id FROM app.memberships)));
