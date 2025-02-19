-- Crear base de datos y tablas

-- Elimina la base de datos si ya existía
DROP DATABASE IF EXISTS FutbolEnRaya;

-- Crea la base de datos
CREATE DATABASE FutbolEnRaya;
USE FutbolEnRaya;

-- Tabla de nacionalidades
CREATE TABLE nationalities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

-- Tabla de clubes
CREATE TABLE clubs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

-- Tabla de jugadores
CREATE TABLE players (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  nationality_id INT NOT NULL,
  FOREIGN KEY (nationality_id) REFERENCES nationalities(id)
);

-- Tabla intermedia para la relación muchos-a-muchos (jugador-club)
CREATE TABLE player_clubs (
  player_id INT NOT NULL,
  club_id INT NOT NULL,
  PRIMARY KEY (player_id, club_id),
  FOREIGN KEY (player_id) REFERENCES players(id),
  FOREIGN KEY (club_id) REFERENCES clubs(id)
);

ALTER TABLE players
ADD CONSTRAINT unique_player_name_nationality
UNIQUE (name, nationality_id);

select * from players;
select * from clubs;
select * from nationalities;
