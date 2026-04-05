ALTER TABLE reward_options
  ADD COLUMN IF NOT EXISTS free_toppings_limit integer NOT NULL DEFAULT 3;


INSERT INTO reward_options (label, points, free_toppings_limit)
SELECT t.label, t.points, t.free_toppings_limit
FROM (VALUES
  ('Açaí 300ml', 10, 3),
  ('Açaí 400ml', 12, 3),
  ('Açaí 500ml', 15, 4),
  ('Açaí 700ml', 20, 5),
  ('Açaí 1L', 25, 6)
) AS t(label, points, free_toppings_limit)
WHERE NOT EXISTS (
  SELECT 1 FROM reward_options r WHERE r.label = t.label
);

CREATE TABLE IF NOT EXISTS toppings (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  price      numeric NOT NULL DEFAULT 0,
  is_paid    boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

INSERT INTO toppings (name, price, is_paid)
SELECT t.name, 0, false
FROM (VALUES
  ('Granola'),
  ('Paçoca'),
  ('Amendoim'),
  ('Confetti'),
  ('Banana'),
  ('Manga'),
  ('Kiwi'),
  ('Uva'),
  ('Gotas de chocolate'),
  ('Leite condensado'),
  ('Leite em pó'),
  ('Chocoball')
) AS t(name)
WHERE NOT EXISTS (
  SELECT 1 FROM toppings WHERE toppings.name = t.name
);

INSERT INTO toppings (name, price, is_paid)
SELECT t.name, t.price, true
FROM (VALUES
  ('Stikadinho',      4),
  ('Ovomaltine',      4),
  ('Ouro Branco',     5),
  ('KitKat',          6),
  ('Oreo',            3),
  ('Bis Preto',       3),
  ('Bis Branco',      3),
  ('Morango',         4),
  ('Nutella',         7),
  ('Coco ralado',     2),
  ('Rafaello',        8),
  ('Ferrero Rocher',  9),
  ('Creme de Ninho',  4),
  ('Creme de Morango',4),
  ('Creme de Cookies',4)
) AS t(name, price)
WHERE NOT EXISTS (
  SELECT 1 FROM toppings WHERE toppings.name = t.name
);

ALTER TABLE toppings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "toppings_read_public" ON toppings;
CREATE POLICY "toppings_read_public"
  ON toppings FOR SELECT
  USING (true);
