CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents > 0)
);

INSERT INTO products (name, description, price_cents) VALUES
  ('Clavier compact', 'Clavier mecanique compact pour developpeur.', 5990),
  ('Souris precision', 'Souris ergonomique pour poste de travail.', 3490),
  ('Ecran 24 pouces', 'Ecran full HD pour environnement bureautique.', 12990)
ON CONFLICT DO NOTHING;
