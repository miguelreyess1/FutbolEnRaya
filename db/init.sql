-- 1) Crea la base de datos (o usa la que quieras)
CREATE DATABASE IF NOT EXISTS TresEnRaya;
USE TikiTakaDB;

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
('Portugal'),
('France'),
('Argentina'),
('Spain'),
('Wales'),
('Netherlands');

-- 4) Insertar clubes necesarios
INSERT IGNORE INTO clubs (name) VALUES
('Sporting CP'),
('Manchester United'),
('Real Madrid'),
('Juventus'),
('Al Nassr'),
('Lyon'),
('Al Ittihad'),
('Newell''s Old Boys'),
('Barcelona'),
('PSG'),
('Inter Miami'),
('Vissel Kobe'),
('Emirates Club'),
('Sevilla'),
('Southampton'),
('Tottenham Hotspur'),
('LAFC'),
('Groningen'),
('PSV'),
('Chelsea'),
('Bayern Munich');

-- 5) Insertar jugadores (1 nacionalidad cada uno)
-- Usamos subconsultas para no depender de IDs fijos

-- Cristiano Ronaldo
INSERT IGNORE INTO players (name, nationality_id)
SELECT 'Cristiano Ronaldo', n.id
FROM nationalities n
WHERE n.name = 'Portugal'
LIMIT 1;

-- Karim Benzema
INSERT IGNORE INTO players (name, nationality_id)
SELECT 'Karim Benzema', n.id
FROM nationalities n
WHERE n.name = 'France'
LIMIT 1;

-- Lionel Messi
INSERT IGNORE INTO players (name, nationality_id)
SELECT 'Lionel Messi', n.id
FROM nationalities n
WHERE n.name = 'Argentina'
LIMIT 1;

-- Andres Iniesta
INSERT IGNORE INTO players (name, nationality_id)
SELECT 'Andres Iniesta', n.id
FROM nationalities n
WHERE n.name = 'Spain'
LIMIT 1;

-- Sergio Ramos
INSERT IGNORE INTO players (name, nationality_id)
SELECT 'Sergio Ramos', n.id
FROM nationalities n
WHERE n.name = 'Spain'
LIMIT 1;

-- Gareth Bale
INSERT IGNORE INTO players (name, nationality_id)
SELECT 'Gareth Bale', n.id
FROM nationalities n
WHERE n.name = 'Wales'
LIMIT 1;

-- Arjen Robben
INSERT IGNORE INTO players (name, nationality_id)
SELECT 'Arjen Robben', n.id
FROM nationalities n
WHERE n.name = 'Netherlands'
LIMIT 1;

-- 6) Relacionar cada jugador con sus clubes en la tabla intermedia

-- Cristiano Ronaldo
INSERT IGNORE INTO player_clubs (player_id, club_id)
SELECT p.id, c.id
FROM players p, clubs c
WHERE p.name = 'Cristiano Ronaldo'
  AND c.name IN ('Sporting (Portugal)', 'Manchester United', 'Real Madrid', 'Juventus', 'Al Nassr');

-- Karim Benzema
INSERT IGNORE INTO player_clubs (player_id, club_id)
SELECT p.id, c.id
FROM players p, clubs c
WHERE p.name = 'Karim Benzema'
  AND c.name IN ('Lyon', 'Real Madrid', 'Al Ittihad');

-- Lionel Messi
INSERT IGNORE INTO player_clubs (player_id, club_id)
SELECT p.id, c.id
FROM players p, clubs c
WHERE p.name = 'Lionel Messi'
  AND c.name IN ('Newell''s Old Boys', 'Barcelona', 'PSG', 'Inter Miami');

-- Andres Iniesta
INSERT IGNORE INTO player_clubs (player_id, club_id)
SELECT p.id, c.id
FROM players p, clubs c
WHERE p.name = 'Andres Iniesta'
  AND c.name IN ('Barcelona', 'Vissel Kobe', 'Emirates Club');

-- Sergio Ramos
INSERT IGNORE INTO player_clubs (player_id, club_id)
SELECT p.id, c.id
FROM players p, clubs c
WHERE p.name = 'Sergio Ramos'
  AND c.name IN ('Sevilla', 'Real Madrid', 'PSG');

-- Gareth Bale
INSERT IGNORE INTO player_clubs (player_id, club_id)
SELECT p.id, c.id
FROM players p, clubs c
WHERE p.name = 'Gareth Bale'
  AND c.name IN ('Southampton', 'Tottenham Hotspur', 'Real Madrid', 'LAFC');

-- Arjen Robben
INSERT IGNORE INTO player_clubs (player_id, club_id)
SELECT p.id, c.id
FROM players p, clubs c
WHERE p.name = 'Arjen Robben'
  AND c.name IN ('Groningen', 'PSV', 'Chelsea', 'Real Madrid', 'Bayern Munich');

-- ¡Listo! Revisa los datos:
SELECT * FROM players;
-- SELECT * FROM clubs;
-- SELECT * FROM player_clubs;
