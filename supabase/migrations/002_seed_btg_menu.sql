-- ============================================================================
-- Bocage Champagne Society — Full Wine Menu Seed
-- ============================================================================
-- Adds service_type column and seeds the complete BTG + Bottle menu.
-- Table: bocage_wines
-- ============================================================================

-- Add service_type column (glass vs bottle)
DO $$ BEGIN
  ALTER TABLE bocage_wines ADD COLUMN service_type TEXT DEFAULT 'glass';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Clear existing wines for clean seed
DELETE FROM bocage_wines;

-- ═══════════════════════════════════════════════════════════════════════════
-- BY THE GLASS — SPARKLING
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO bocage_wines (name, producer, region, vintage, category, description, price_glass, is_available, is_featured, service_type) VALUES
  ('Bocage Cuvée',                    NULL, NULL,                NULL, 'sparkling', 'House sparkling cuvée',          16.00, true, true, 'glass'),
  ('Vino Espumoso Muntanya',          NULL, 'Spain',             NULL, 'sparkling', 'Spanish sparkling',              18.00, true, false, 'glass'),
  ('Cleto Chiarli Lambrusco',         NULL, 'Italy',             NULL, 'sparkling', 'Lambrusco',                      17.00, true, false, 'glass'),
  ('Lavrencic',                       NULL, NULL,                NULL, 'sparkling', 'Brut Nature',                    23.00, true, false, 'glass'),
  ('Daumas Gassac Rosé',              NULL, 'France',            NULL, 'sparkling', 'Sparkling rosé',                 17.00, true, false, 'glass'),
  ('Diletta Tonello Pét-Nat',         NULL, 'Italy',             NULL, 'sparkling', 'Pétillant naturel',              16.00, true, false, 'glass'),
  ('Pignier Crémant du Jura',         NULL, 'Jura, France',      NULL, 'sparkling', 'Crémant',                        25.00, true, false, 'glass'),
  ('Selbach-Oster Pinot Brut Sekt',   NULL, 'Germany',           NULL, 'sparkling', 'Pinot Sekt',                     20.00, true, false, 'glass'),
  ('Szigeti',                         NULL, 'Austria',           2017, 'sparkling', 'Austrian sparkling',             18.00, true, false, 'glass');

-- BY THE GLASS — CHAMPAGNE
INSERT INTO bocage_wines (name, producer, region, vintage, category, description, price_glass, is_available, is_featured, service_type) VALUES
  ('Thiénot Brut',                    NULL, 'Champagne, France', NULL, 'champagne', 'Cuvée — served from Magnum',     26.00, true, false, 'glass'),
  ('Charles Ellner',                  NULL, 'Champagne, France', NULL, 'champagne', 'Cuvée',                          29.00, true, false, 'glass'),
  ('Gamet Rive Droite',               NULL, 'Champagne, France', NULL, 'champagne', 'Blanc de Noirs',                 31.00, true, false, 'glass'),
  ('Guiborat Blanc de Blancs',        NULL, 'Champagne, France', NULL, 'champagne', 'Blanc de Blancs',                35.00, true, true, 'glass'),
  ('Gatinois Rosé',                   NULL, 'Champagne, France', NULL, 'champagne', 'Rosé Champagne',                 40.00, true, true, 'glass'),
  ('Megan''s Champagne',              NULL, 'Champagne, France', NULL, 'champagne', 'Blanc de Noirs · Brut Nature',   49.00, true, true, 'glass'),
  ('Drappier Rosé de Riceys',         NULL, 'Champagne, France', NULL, 'champagne', NULL,                              65.00, true, true, 'glass'),
  ('Le Mesnil Blanc de Blancs',       NULL, 'Champagne, France', 2014, 'champagne', 'Grand Cru Blanc de Blancs',      75.00, true, true, 'glass');

-- BY THE GLASS — STILL WHITE
INSERT INTO bocage_wines (name, producer, region, vintage, category, description, price_glass, is_available, is_featured, service_type) VALUES
  ('Friulano',                        NULL, 'Friuli, Italy',     NULL, 'still', 'White — Friulano',                   16.00, true, false, 'glass'),
  ('Allegrini Lugana',                NULL, 'Veneto, Italy',     NULL, 'still', 'White — Lugana',                     18.00, true, false, 'glass'),
  ('Alain Chavy White Burgundy',      NULL, 'Burgundy, France',  NULL, 'still', 'White Burgundy',                     25.00, true, false, 'glass');

-- BY THE GLASS — STILL RED
INSERT INTO bocage_wines (name, producer, region, vintage, category, description, price_glass, is_available, is_featured, service_type) VALUES
  ('Alpha Estate Xinomavro',          NULL, 'Greece',            NULL, 'still', 'Red — Xinomavro',                    19.00, true, false, 'glass'),
  ('Reverdy-Ducroux Sancerre Rouge',  NULL, 'Loire, France',     NULL, 'still', 'Red — Pinot Noir',                   25.00, true, false, 'glass'),
  ('Alto Moncayo Garnacha',           NULL, 'Spain',             NULL, 'still', 'Red — Garnacha',                     16.00, true, false, 'glass');

-- BY THE GLASS — STILL ROSÉ / ORANGE
INSERT INTO bocage_wines (name, producer, region, vintage, category, description, price_glass, is_available, is_featured, service_type) VALUES
  ('Language of Yes Rosé',            NULL, 'California',        NULL, 'still', 'Rosé',                               16.00, true, false, 'glass'),
  ('Cazes Macabeu Amber Wine',        NULL, 'Roussillon, France', NULL, 'still', 'Orange — Macabeu',                   14.00, true, false, 'glass'),
  ('Vinho Verde Rosé Escudo Real',    NULL, 'Portugal',          NULL, 'still', 'Rosé — Vinho Verde',                 13.00, true, false, 'glass');

-- ═══════════════════════════════════════════════════════════════════════════
-- BY THE BOTTLE — GROWER CHAMPAGNE
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO bocage_wines (name, producer, region, vintage, category, description, price_bottle, is_available, is_featured, service_type) VALUES
  ('Jean Laurent Blanc de Blancs Brut',              'Jean Laurent',           'Champagne, France', NULL, 'grower', 'Chardonnay',                                          140.00, true, false, 'bottle'),
  ('Solemme Brut Nature 1er Cru',                    'Solemme',                'Champagne, France', 2016, 'grower', 'Pinot Meunier, Chardonnay, Pinot Noir',                165.00, true, false, 'bottle'),
  ('Pierre Gimonnet 1er Cru Blanc de Blancs',        'Pierre Gimonnet et Fils','Champagne, France', NULL, 'grower', 'Chardonnay',                                          140.00, true, false, 'bottle'),
  ('Jacquart Brut Mosaïque',                         'Jacquart',              'Champagne, France', NULL, 'grower', 'Chardonnay, Pinot Noir, Pinot Meunier',                135.00, true, false, 'bottle'),
  ('Pertois-Moriset Grand Cru Brut',                 'Pertois-Moriset',       'Champagne, France', NULL, 'grower', 'Chardonnay',                                           175.00, true, false, 'bottle'),
  ('Marc Hebrart 1er Cru Brut Rosé',                 'Marc Hebrart',          'Champagne, France', NULL, 'grower', 'Pinot Noir, Chardonnay',                               170.00, true, false, 'bottle'),
  ('Deutz Brut Classic',                              'Deutz',                 'Champagne, France', NULL, 'grower', 'Pinot Noir, Pinot Meunier, Chardonnay',                180.00, true, false, 'bottle'),
  ('Marc Hebrart 1er Cru Blanc de Blancs',            'Marc Hebrart',          'Champagne, France', NULL, 'grower', 'Chardonnay',                                          165.00, true, false, 'bottle'),
  ('Sadi Malot 1er Cru Brut Nature Blanc de Blancs',  'Sadi Malot',           'Champagne, France', NULL, 'grower', 'Chardonnay',                                           210.00, true, false, 'bottle'),
  ('Françoise Bedel Entre Ciel Et Terre',             'Françoise Bedel & Fils','Champagne, France', NULL, 'grower', 'Pinot Meunier, Chardonnay, Pinot Noir',               210.00, true, false, 'bottle'),
  ('Marc Hebrart Special Club',                       'Marc Hebrart',          'Champagne, France', 2021, 'grower', 'Chardonnay',                                          255.00, true, false, 'bottle'),
  ('Laherte Frères Extra Brut',                       'Laherte Frères',        'Champagne, France', NULL, 'grower', 'Petit Meslier — zesty lime, green pear, pineapple, chalky minerality and racy acidity. A true rarity.', 325.00, true, true, 'bottle'),
  ('Moussé Fils Brut Nature Longue Garde',            'Moussé Fils',           'Champagne, France', NULL, 'grower', 'Pinot Meunier',                                       405.00, true, true, 'bottle'),
  ('Drappier Brut Nature',                            'Drappier',              'Champagne, France', NULL, 'grower', 'Pinot Noir',                                           150.00, true, false, 'bottle'),
  ('Laurent-Perrier Harmony Demi-Sec',                'Laurent-Perrier',       'Champagne, France', NULL, 'grower', 'Pinot Noir',                                           155.00, true, false, 'bottle'),
  ('Drappier Blanc de Blancs',                        'Drappier',              'Champagne, France', NULL, 'grower', 'Chardonnay, Pinot Blanc',                              185.00, true, false, 'bottle'),
  ('Billecart-Salmon Extra Brut Le Rosé',             'Billecart-Salmon',      'Champagne, France', NULL, 'grower', 'Chardonnay, Pinot Noir',                               255.00, true, false, 'bottle'),
  ('Drappier Trop m''en Faut!',                       'Drappier',              'Champagne, France', NULL, 'grower', 'Fromentau (Pinot Gris) — ripe orchard fruit, peach skin, gentle florals, supple mousse. A rare heritage grape.', 315.00, true, true, 'bottle'),
  ('Ayala Extra Brut Blanc de Blancs A/18',           'Ayala',                 'Champagne, France', NULL, 'grower', 'Chardonnay',                                           299.00, true, false, 'bottle'),
  ('Jean Laurent Cuvée Alpha',                        'Jean Laurent',          'Champagne, France', 2010, 'grower', 'Chardonnay',                                          400.00, true, false, 'bottle'),
  ('Jacquart Blanc de Blancs',                        'Jacquart',              'Champagne, France', 2013, 'grower', 'Chardonnay',                                           385.00, true, false, 'bottle'),
  ('Dumont Père et Fils Blanc de Noirs',              'Dumont Père et Fils',   'Champagne, France', 2009, 'grower', 'Pinot Noir',                                           275.00, true, false, 'bottle');

-- ═══════════════════════════════════════════════════════════════════════════
-- BY THE BOTTLE — PROMINENT HOUSES
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO bocage_wines (name, producer, region, vintage, category, description, price_bottle, is_available, is_featured, service_type) VALUES
  ('Bollinger Special Cuvée',                       'Bollinger',          'Champagne, France', NULL, 'prominent', 'Pinot Noir, Chardonnay, Pinot Meunier',         255.00, true, false, 'bottle'),
  ('Laurent-Perrier Blanc de Blancs Brut Nature',   'Laurent-Perrier',    'Champagne, France', NULL, 'prominent', 'Chardonnay',                                    255.00, true, false, 'bottle'),
  ('Drappier Grande Sendrée',                       'Drappier',           'Champagne, France', 2009, 'prominent', 'Pinot Noir, Chardonnay',                         335.00, true, false, 'bottle'),
  ('Drappier Quattuor',                             'Drappier',           'Champagne, France', NULL, 'prominent', 'Arbane, Petit Meslier, Chardonnay, Pinot Blanc', 365.00, true, false, 'bottle'),
  ('Bollinger PN TX',                               'Bollinger',          'Champagne, France', 2017, 'prominent', 'Pinot Noir',                                     385.00, true, false, 'bottle'),
  ('Laurent-Perrier Grand Siècle No. 26',           'Laurent-Perrier',    'Champagne, France', NULL, 'prominent', 'Chardonnay, Pinot Noir',                         425.00, true, false, 'bottle'),
  ('Bollinger La Grande Année',                     'Bollinger',          'Champagne, France', 2014, 'prominent', 'Pinot Noir, Chardonnay',                         475.00, true, true,  'bottle'),
  ('Dom Pérignon Brut',                             'Dom Pérignon',       'Champagne, France', 2015, 'prominent', 'Chardonnay, Pinot Noir',                         525.00, true, true,  'bottle'),
  ('Taittinger Comtes de Champagne',                'Taittinger',         'Champagne, France', 2011, 'prominent', 'Chardonnay — Blanc de Blancs Brut',              525.00, true, true,  'bottle'),
  ('Krug Grande Cuvée 172ème Édition',              'Krug',               'Champagne, France', NULL, 'prominent', 'Pinot Noir, Chardonnay, Pinot Meunier',         585.00, true, true,  'bottle'),
  ('Perrier-Jouët Belle Époque',                    'Perrier-Jouët',      'Champagne, France', 2013, 'prominent', 'Chardonnay, Pinot Noir',                         599.00, true, true,  'bottle'),
  ('Veuve Clicquot La Grande Dame Rosé',            'Veuve Clicquot',     'Champagne, France', 2012, 'prominent', 'Pinot Noir, Chardonnay',                         599.00, true, true,  'bottle'),
  ('Louis Roederer Cristal',                        'Louis Roederer',     'Champagne, France', 2016, 'prominent', 'Chardonnay, Pinot Noir',                         650.00, true, true,  'bottle'),
  ('Armand de Brignac Ace of Spades',               'Armand de Brignac',  'Champagne, France', NULL, 'prominent', 'Pinot Noir, Pinot Meunier, Chardonnay',         699.00, true, true,  'bottle'),
  ('Armand de Brignac Rosé Ace of Spades',          'Armand de Brignac',  'Champagne, France', NULL, 'prominent', 'Pinot Noir, Pinot Meunier, Chardonnay',         725.00, true, true,  'bottle'),
  ('Krug Brut',                                     'Krug',               'Champagne, France', 2011, 'prominent', 'Chardonnay, Pinot Noir, Pinot Meunier',         799.00, true, true,  'bottle'),
  ('Salon Le Mesnil Blanc de Blancs',               'Salon',              'Champagne, France', 2013, 'prominent', 'Chardonnay — Grand Cru single-vineyard, notes of citrus, white flowers, chalky minerality. Only produced in exceptional vintages.', 2000.00, true, true, 'bottle');

-- ═══════════════════════════════════════════════════════════════════════════
-- BY THE BOTTLE — LARGE FORMAT (Magnums)
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO bocage_wines (name, producer, region, vintage, category, description, price_bottle, is_available, is_featured, service_type) VALUES
  ('Gamet Rive Gauche Brut (Magnum)',                'Gamet',                'Champagne, France', NULL, 'large_format', 'Magnum 1.5L',                    300.00, true, false, 'bottle'),
  ('Drappier Brut Nature (Magnum)',                  'Drappier',             'Champagne, France', NULL, 'large_format', 'Magnum 1.5L — Pinot Noir',       325.00, true, false, 'bottle'),
  ('Veuve Fourny Monts de Vertus 1er Cru (Magnum)',  'Veuve Fourny et Fils', 'Champagne, France', 2014, 'large_format', 'Magnum 1.5L — Extra Brut',       375.00, true, false, 'bottle'),
  ('Moussé Fils Blanc de Meuniers (Magnum)',         'Moussé Fils',          'Champagne, France', NULL, 'large_format', 'Magnum 1.5L — Pinot Meunier',    425.00, true, false, 'bottle'),
  ('Jean Laurent La Griffe de L''Ource (Magnum)',    'Jean Laurent',         'Champagne, France', 2008, 'large_format', 'Magnum 1.5L — Millésime',        455.00, true, false, 'bottle');

-- ═══════════════════════════════════════════════════════════════════════════
-- BY THE BOTTLE — CELLAR SELECTIONS
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO bocage_wines (name, producer, region, vintage, category, description, price_bottle, is_available, is_featured, service_type) VALUES
  ('Jean Laurent Cellar Selection',                  'Jean Laurent',  'Champagne, France', 1978, 'cellar', 'Pinot Noir',              675.00, true, true,  'bottle'),
  ('Jean Laurent Cellar Selection',                  'Jean Laurent',  'Champagne, France', 1995, 'cellar', 'Pinot Noir',              525.00, true, false, 'bottle'),
  ('Jean Laurent Cellar Selection',                  'Jean Laurent',  'Champagne, France', 2000, 'cellar', 'Pinot Noir',              345.00, true, false, 'bottle'),
  ('Jean Laurent Cellar Selection',                  'Jean Laurent',  'Champagne, France', 2000, 'cellar', 'Chardonnay',              325.00, true, false, 'bottle'),
  ('Jean Laurent Cellar Selection',                  'Jean Laurent',  'Champagne, France', 2002, 'cellar', 'Pinot Noir',              300.00, true, false, 'bottle'),
  ('Jean Laurent Cellar Selection',                  'Jean Laurent',  'Champagne, France', 2009, 'cellar', 'Pinot Noir',              345.00, true, false, 'bottle'),
  ('Drappier Réserve Œnothèque',                    'Drappier',      'Champagne, France', 2004, 'cellar', 'Pinot Noir, Chardonnay — dried fruit, brioche, spice, creamy richness. Limited cellar release.', 465.00, true, true, 'bottle'),
  ('Drappier Réserve Œnothèque',                    'Drappier',      'Champagne, France', 2005, 'cellar', 'Pinot Noir, Chardonnay — dried fruit, brioche, spice, creamy richness. Limited cellar release.', 445.00, true, true, 'bottle');
