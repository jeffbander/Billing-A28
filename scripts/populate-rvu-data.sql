-- Populate Work RVU and Procedure Type for existing CPT codes
-- CMS 2025 Work RVU values

-- Imaging procedures
UPDATE cpt_codes SET workRvu = '4.75', procedureType = 'imaging' WHERE code = '78452';
UPDATE cpt_codes SET workRvu = '1.40', procedureType = 'imaging' WHERE code = '93306';
UPDATE cpt_codes SET workRvu = '1.60', procedureType = 'imaging' WHERE code = '93351';

-- Office visits
UPDATE cpt_codes SET workRvu = '1.60', procedureType = 'visit' WHERE code = '99203';
UPDATE cpt_codes SET workRvu = '2.60', procedureType = 'visit' WHERE code = '99204';
UPDATE cpt_codes SET workRvu = '3.50', procedureType = 'visit' WHERE code = '99205';
UPDATE cpt_codes SET workRvu = '0.97', procedureType = 'visit' WHERE code = '99213';
UPDATE cpt_codes SET workRvu = '1.50', procedureType = 'visit' WHERE code = '99214';
UPDATE cpt_codes SET workRvu = '2.10', procedureType = 'visit' WHERE code = '99215';

-- Verify the updates
SELECT code, description, workRvu, procedureType FROM cpt_codes ORDER BY code;
