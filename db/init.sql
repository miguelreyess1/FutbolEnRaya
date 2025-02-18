-- 1) Crea la base de datos (o usa la que quieras)

CREATE DATABASE IF NOT EXISTS FutbolEnRaya;
USE FutbolEnRaya;

-- 2) Crea las tablas
DROP TABLE IF EXISTS player_clubs;
DROP TABLE IF EXISTS players;
DROP TABLE IF EXISTS clubs;
DROP TABLE IF EXISTS nationalities;

CREATE TABLE nationalities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE clubs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE players (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  nationality_id INT NOT NULL,
  FOREIGN KEY (nationality_id) REFERENCES nationalities(id)
);

CREATE TABLE player_clubs (
  player_id INT NOT NULL,
  club_id INT NOT NULL,
  PRIMARY KEY (player_id, club_id),
  FOREIGN KEY (player_id) REFERENCES players(id),
  FOREIGN KEY (club_id) REFERENCES clubs(id)
);

-- 3) Insertar nacionalidades necesarias
INSERT IGNORE INTO nationalities (name) VALUES
('España'),
('Francia'),
('Portugal');

-- 4) Insertar clubes necesarios
INSERT IGNORE INTO clubs (name) VALUES
('Real Madrid'),
('Barcelona'),
('Atletico de Madrid');


-- 5) Insertar jugadores (1 nacionalidad cada uno)
-- Usamos subconsultas para no depender de IDs fijos

INSERT IGNORE INTO players (name, nationality_id)
SELECT 'Dani Carvajal', n.id
FROM nationalities n
WHERE n.name = 'España'
LIMIT 1;

INSERT IGNORE INTO players (name, nationality_id)
SELECT 'Eduardo Camavinga', n.id
FROM nationalities n
WHERE n.name = 'Francia'
LIMIT 1;

INSERT IGNORE INTO players (name, nationality_id)
SELECT 'Luis Figo', n.id
FROM nationalities n
WHERE n.name = 'Portugal'
LIMIT 1;

INSERT IGNORE INTO players (name, nationality_id)
SELECT 'Griezmann', n.id
FROM nationalities n
WHERE n.name = 'Francia'
LIMIT 1;

INSERT IGNORE INTO players (name, nationality_id)
SELECT 'Joao Felix', n.id
FROM nationalities n
WHERE n.name = 'Portugal'
LIMIT 1;

INSERT IGNORE INTO players (name, nationality_id)
SELECT 'Koke', n.id
FROM nationalities n
WHERE n.name = 'España'
LIMIT 1;

-- 6) Relacionar cada jugador con sus clubes en la tabla intermedia

INSERT IGNORE INTO player_clubs (player_id, club_id)
SELECT p.id, c.id
FROM players p, clubs c
WHERE p.name = 'Dani Carvajal'
  AND c.name IN ('Real Madrid');

INSERT IGNORE INTO player_clubs (player_id, club_id)
SELECT p.id, c.id
FROM players p, clubs c
WHERE p.name = 'Eduardo Camavinga'
  AND c.name IN ('Real Madrid');

INSERT IGNORE INTO player_clubs (player_id, club_id)
SELECT p.id, c.id
FROM players p, clubs c
WHERE p.name = 'Luis Figo'
  AND c.name IN ('Real Madrid', 'Barcelona');
  
  INSERT IGNORE INTO player_clubs (player_id, club_id)
SELECT p.id, c.id
FROM players p, clubs c
WHERE p.name = 'Griezmann'
  AND c.name IN ('Atletico Madrid', 'Barcelona');
  
    INSERT IGNORE INTO player_clubs (player_id, club_id)
SELECT p.id, c.id
FROM players p, clubs c
WHERE p.name = 'Joao Felix'
  AND c.name IN ('Atletico Madrid', 'Barcelona');
  
    INSERT IGNORE INTO player_clubs (player_id, club_id)
SELECT p.id, c.id
FROM players p, clubs c
WHERE p.name = 'Koke'
  AND c.name IN ('Atletico Madrid');

-- ¡Listo! Revisa los datos:
-- SELECT * FROM players;
-- SELECT * FROM clubs;
-- SELECT * FROM player_clubs;

