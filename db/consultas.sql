-- Consultas en la base de datos
-- Jugadores que han estado en x club
Use FutbolEnRaya;
SELECT p.name AS jugador
FROM players p
JOIN player_clubs pc ON pc.player_id = p.id
JOIN clubs c ON c.id = pc.club_id
WHERE c.name = 'VfB Stuttgart';

-- Borrar un club
USE FutbolEnRaya;
delete from clubs where clubs.name = "orueba";

-- SELECT DE CLUBES, JUGADORES Y NACIONES
USE FutbolEnRaya;
select * from clubs;
select * from players;
select * from nationalities;

-- Asignar una liga a un equipo
USE FutbolEnRaya;
UPDATE clubs
SET league = 'Alemania'
WHERE name = 'Stuttgart';

-- Ver equipos de un jugador
SELECT c.name AS club
FROM players p
JOIN player_clubs pc ON pc.player_id = p.id
JOIN clubs c ON c.id = pc.club_id
WHERE p.name = 'Clement Lenglet';

-- Añadir un equipo a un jugador
INSERT INTO player_clubs (player_id, club_id)
VALUES (
  (SELECT id FROM players WHERE name = 'Toni Lato'),
  (SELECT id FROM clubs WHERE name = 'PSV')
);

-- Crear equipo
USE FutbolEnRaya;
INSERT INTO clubs (name, league) VALUES
('PSV', 'Holanda');

-- Crear un jugador
INSERT INTO players (name, nationality_id)
SELECT 'Alex Baena', 1
WHERE NOT EXISTS (
  SELECT 1 
  FROM players
  WHERE name = 'Alex Baena'
);
