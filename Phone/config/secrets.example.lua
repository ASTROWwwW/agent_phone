-- Modele de secrets serveur. Copie ce fichier en config/secrets.lua et
-- remplis les trois valeurs avec des chaines hexadecimales aleatoires.
--
-- Pour en generer une :
--   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
--
-- config/secrets.lua est exclu du depot. Ne le commite jamais.
-- Changer un pepper invalide les mots de passe deja enregistres.

Config.Server = Config.Server or {}

Config.Server.PasscodePepper = ""
Config.Server.FlipTokPasswordPepper = ""
Config.Server.PicstagramPasswordPepper = ""
