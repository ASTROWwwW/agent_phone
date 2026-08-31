-- Modele de secrets serveur. Copie ce fichier en config/secrets.lua et
-- remplis les quatre valeurs avec des chaines hexadecimales aleatoires.
--
-- Pour en generer une :
--   node -e "console.log(require(String.fromCharCode(99,114,121,112,116,111)).randomBytes(32).toString(String.fromCharCode(104,101,120)))"
--
-- config/secrets.lua est exclu du depot. Ne le commite jamais.
-- Changer un pepper invalide les mots de passe deja enregistres.

Config.Server = Config.Server or {}

Config.Server.PasscodePepper = ""
Config.Server.CrewLinkPasswordPepper = ""
Config.Server.FlipTokPasswordPepper = ""
Config.Server.PicstagramPasswordPepper = ""
