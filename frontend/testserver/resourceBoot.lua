-- Charge la configuration et les locales de la ressource comme le ferait le
-- serveur, avec des bouchons pour les fonctions du moteur. Une erreur ici est
-- une erreur au demarrage : c'est ce que luac -p ne peut pas voir, puisqu'il ne
-- verifie que la syntaxe.
local root = ...
assert(root, "chemin de la ressource attendu")

local loaded = {}
local failures = {}

-- ------------------------------------------------------------- bouchons Cfx
local resource_name = "agent_phone"

function GetCurrentResourceName() return resource_name end
function GetResourceState(name) return name == "Agent" and "started" or "missing" end
function IsDuplicityVersion() return true end
function GetConvar(_, fallback) return fallback end
function GetConvarInt(_, fallback) return fallback end
function CreateThread(fn) return fn end
function Wait() end
function AddEventHandler() end
function RegisterNetEvent() end
function TriggerEvent() end
function ExecuteCommand() end
function RegisterCommand() end
function print_stub() end
function vector3(x, y, z) return { x = x, y = y, z = z } end
function vector4(x, y, z, w) return { w = w, x = x, y = y, z = z } end

exports = setmetatable({}, {
  __index = function()
    return setmetatable({}, { __index = function() return function() return nil end end })
  end,
})

Locales = {}
Config = {}

function TranslateCap(key) return key end

-- ------------------------------------------------------------------ chargeur
local function run(relative)
  local path = root .. "/" .. relative
  local chunk, syntax_error = loadfile(path)

  if not chunk then
    failures[#failures + 1] = relative .. " : " .. tostring(syntax_error)
    return
  end

  local ok, runtime_error = pcall(chunk)
  if not ok then
    failures[#failures + 1] = relative .. " : " .. tostring(runtime_error)
    return
  end

  loaded[#loaded + 1] = relative
end

run("config/config.lua")
run("config/media.lua")
run("config/locales/en.lua")
run("config/locales/fr.lua")
run("config/locales/de.lua")
run("config/locales/es.lua")
run("source/shared/config_default.lua")

-- ------------------------------------------------------------------ rapport
print("  fichiers charges : " .. #loaded)

for _, failure in ipairs(failures) do
  print("  ECHEC " .. failure)
end

if #failures > 0 then
  os.exit(1)
end

-- Quelques invariants que seule l'execution revele.
local checks = {
  { "Config.Bridge.Locale", Config.Bridge and Config.Bridge.Locale },
  { "Config.Phone.Item", Config.Phone and Config.Phone.Item },
  { "Config.Sim.RegisteredItem", Config.Sim and Config.Sim.RegisteredItem },
  { "Config.Garage.System", Config.Garage and Config.Garage.System },
  { "Config.Banking.MinimumAmount", Config.Banking and Config.Banking.MinimumAmount },
}

for _, check in ipairs(checks) do
  if check[2] == nil then
    print("  MANQUE " .. check[1])
    os.exit(1)
  end
  print("  " .. check[1] .. " = " .. tostring(check[2]))
end

local locale_count = 0
for _ in pairs(Locales) do locale_count = locale_count + 1 end
print("  locales chargees : " .. locale_count)

if not Locales[Config.Bridge.Locale] then
  print("  MANQUE la locale configuree : " .. tostring(Config.Bridge.Locale))
  os.exit(1)
end

print("  locale configuree presente : " .. Config.Bridge.Locale)
