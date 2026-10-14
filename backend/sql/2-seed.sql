-- Sample data, labelled so it is never mistaken for real recipes.
-- Fixed ids and ON DUPLICATE KEY UPDATE make this safe to run more than once,
-- while foreign-key errors still fail loudly (INSERT IGNORE would hide them).
-- The demo user's pass_hash is '!', which no password can match.
INSERT INTO users (id, username, pass_hash) VALUES (1, 'demo', '!')
  ON DUPLICATE KEY UPDATE id = id;

INSERT INTO recipes (id, title, content, ingredients, steps, user_id) VALUES
(1, '[Sample] Overnight oats',
 'A no-cook breakfast you make the night before.',
 '1/2 cup rolled oats\n1/2 cup milk\n1/4 cup yogurt\n1 tsp honey\nBerries to serve',
 'Mix oats, milk, yogurt, and honey in a jar.\nCover and chill overnight.\nTop with berries and eat cold.',
 1),
(2, '[Sample] Garlic fried rice',
 'Uses up day-old rice in ten minutes.',
 '2 cups cooked rice, cold\n4 cloves garlic, minced\n1 egg\n1 tbsp soy sauce\n1 spring onion',
 'Fry the garlic in oil until golden.\nAdd the rice and stir-fry for 3 minutes.\nPush aside, scramble the egg, then mix through.\nSeason with soy sauce and top with spring onion.',
 1),
(3, '[Sample] Tomato egg soup',
 'A light soup for a quick dinner.',
 '2 tomatoes\n2 eggs\n3 cups stock\n1 tsp cornstarch\nSalt and pepper',
 'Simmer chopped tomatoes in the stock for 5 minutes.\nThicken with cornstarch mixed in water.\nDrizzle in beaten eggs while stirring.\nSeason and serve.',
 1)
ON DUPLICATE KEY UPDATE id = id;

INSERT INTO tags (id, name) VALUES (1, 'Breakfast'), (2, 'Dinner'), (3, 'Quick')
  ON DUPLICATE KEY UPDATE id = id;
INSERT INTO recipe_tags (recipe_id, tag_id) VALUES (1, 1), (2, 3), (3, 2), (3, 3)
  ON DUPLICATE KEY UPDATE tag_id = tag_id;
