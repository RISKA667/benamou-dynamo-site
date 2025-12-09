-- Migration initiale : schéma GeneWeb Rust
-- Table des wizards (administrateurs)
CREATE TABLE IF NOT EXISTS wizards (
    id UUID PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT false,
    permissions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Table des personnes
CREATE TABLE IF NOT EXISTS persons (
    id UUID PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    surname VARCHAR(255) NOT NULL,
    surname_prefix VARCHAR(50),
    sex VARCHAR(10) NOT NULL,
    public BOOLEAN DEFAULT true,
    nicknames TEXT[] DEFAULT ARRAY[]::TEXT[],
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES wizards(id)
);

CREATE INDEX IF NOT EXISTS idx_persons_name ON persons(surname, first_name);
CREATE INDEX IF NOT EXISTS idx_persons_public ON persons(public);
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_persons_name_trgm
    ON persons USING GIN ((surname || ' ' || first_name) gin_trgm_ops);

-- Table des lieux
CREATE TABLE IF NOT EXISTS places (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    locality VARCHAR(255),
    city VARCHAR(255),
    county VARCHAR(255),
    state VARCHAR(255),
    country VARCHAR(255),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION
);

-- Table des familles
CREATE TABLE IF NOT EXISTS families (
    id UUID PRIMARY KEY,
    father_id UUID REFERENCES persons(id) ON DELETE SET NULL,
    mother_id UUID REFERENCES persons(id) ON DELETE SET NULL,
    notes TEXT,
    public BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Relation enfants/famille
CREATE TABLE IF NOT EXISTS family_children (
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    child_id UUID REFERENCES persons(id) ON DELETE CASCADE,
    child_order INTEGER NOT NULL,
    PRIMARY KEY (family_id, child_id)
);

-- Événements (personnes et familles)
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY,
    person_id UUID REFERENCES persons(id) ON DELETE CASCADE,
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    date_type VARCHAR(20) NOT NULL,
    date_value DATE,
    date_value_end DATE,
    place_id UUID REFERENCES places(id),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_person ON events(person_id);
CREATE INDEX IF NOT EXISTS idx_events_family ON events(family_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);

-- Sources
CREATE TABLE IF NOT EXISTS sources (
    id UUID PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    author VARCHAR(255),
    publication_info TEXT,
    repository VARCHAR(255),
    notes TEXT
);

-- Lien événement / source
CREATE TABLE IF NOT EXISTS event_sources (
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    source_id UUID REFERENCES sources(id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, source_id)
);

-- Photos/images associées à une personne
CREATE TABLE IF NOT EXISTS person_images (
    id UUID PRIMARY KEY,
    person_id UUID REFERENCES persons(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    description TEXT,
    is_primary BOOLEAN DEFAULT false
);

-- Titres et distinctions
CREATE TABLE IF NOT EXISTS person_titles (
    id UUID PRIMARY KEY,
    person_id UUID REFERENCES persons(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    place VARCHAR(255),
    date_start DATE,
    date_end DATE,
    nth INTEGER
);

-- Historique des révisions / privacy patches
CREATE TABLE IF NOT EXISTS privacy_logs (
    id UUID PRIMARY KEY,
    person_id UUID REFERENCES persons(id) ON DELETE CASCADE,
    changed_by UUID REFERENCES wizards(id),
    old_public BOOLEAN,
    new_public BOOLEAN,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
