-- Charge reellement le pont serveur avec des doubles d'Agent et d'ox_inventory,
-- puis verifie que les deux gardes s'opposent bien a un demarrage invalide.
local root = ...
assert(root, "chemin de la ressource attendu")

local BRIDGE = {
  "source/bridge/shared.lua",
  "source/bridge/server/framework.lua",
  "source/bridge/server/inventory.lua",
  "source/bridge/server/inventory_contract.lua",
}

local function make_shared_object()
  return {
    GetPlayerFromId = function() return nil end,
    GetExtendedPlayers = function() return {} end,
    RegisterUsableItem = function() end,
  }
end

local function make_inventory()
  local stub = {}
  for _, name in ipairs({ "Items", "GetSlot", "GetSlotsWithItem", "SetMetadata", "CanCarryItem", "AddItem", "RemoveItem" }) do
    stub[name] = function() return nil end
  end
  return stub
end

-- started : ensemble des ressources que le serveur simule comme demarrees.
-- shared_object : ce que l'export d'Agent renvoie.
local function boot(started, shared_object)
  Config = {
    Bridge = { Debug = false, CallbackTimeout = 15000, Locale = "fr" },
    Phone = { Unique = true, Item = "phone" },
    Sim = { Enabled = true },
    CommandPermissions = {},
  }
  Bridge = nil

  function GetResourceState(name)
    return started[name] and "started" or "missing"
  end

  function AddEventHandler() end
  function RegisterNetEvent() end
  function TriggerClientEvent() end

  local inventory = make_inventory()
  exports = setmetatable({}, {
    __index = function(_, key)
      if key == "Agent" then
        return { getSharedObject = function() return shared_object end }
      end
      if key == "ox_inventory" then
        return inventory
      end
      return setmetatable({}, { __index = function() return function() end end })
    end,
  })

  for _, relative in ipairs(BRIDGE) do
    local chunk, syntax_error = loadfile(root .. "/" .. relative)
    if not chunk then
      return false, relative .. " : " .. tostring(syntax_error)
    end
    local ok, runtime_error = pcall(chunk)
    if not ok then
      return false, tostring(runtime_error)
    end
  end

  return true
end

local failures = 0
local function check(label, condition, detail)
  if condition then
    print("  ok    " .. label)
  else
    print("  ECHEC " .. label .. (detail and (" : " .. tostring(detail)) or ""))
    failures = failures + 1
  end
end

-- 1. Demarrage nominal.
local ok, err = boot({ Agent = true, ox_inventory = true }, make_shared_object())
check("le pont demarre avec Agent et ox_inventory", ok, err)

if ok then
  check("Bridge.Framework.Name = agent", Bridge.Framework.Name == "agent", Bridge.Framework.Name)
  check("Bridge.Inventory.Name = ox", Bridge.Inventory.Name == "ox", Bridge.Inventory.Name)
  check("Bridge.Inventory.Resource = ox_inventory", Bridge.Inventory.Resource == "ox_inventory")

  -- Le contrat ne doit avoir remplace aucune methode par un bouchon d'erreur.
  local contract = {
    "GetResourceName", "GetSlot", "GetSlotsWithItem", "SetSlotMetadata",
    "CanCarryItem", "AddItem", "RemoveItem", "RegisterUsableItem",
  }
  local missing = {}
  for _, name in ipairs(contract) do
    if type(Bridge.Inventory[name]) ~= "function" then
      missing[#missing + 1] = name
    end
  end
  check("les 8 methodes du contrat sont presentes", #missing == 0, table.concat(missing, ", "))
  check("GetResourceName renvoie ox_inventory", Bridge.Inventory.GetResourceName() == "ox_inventory")
end

-- 2. La garde d'inventaire mord.
local ok2, err2 = boot({ Agent = true }, make_shared_object())
check("sans ox_inventory, le pont refuse de demarrer", not ok2)
check("et le dit en francais", ok2 == false and tostring(err2):find("ox_inventory", 1, true) ~= nil, err2)

-- 3. La garde d'objet partage mord.
local ok3, err3 = boot({ Agent = true, ox_inventory = true }, { GetPlayerFromId = nil })
check("un objet partage inutilisable est refuse", not ok3)
check("et le message vise la ressource Agent", ok3 == false and tostring(err3):find("Agent", 1, true) ~= nil, err3)

-- 3 bis. La frontiere d'export FiveM ne rend pas les methodes d'ESX sous le
-- type "function" : elles arrivent en references appelables. La garde doit
-- tester leur presence, jamais leur type, sans quoi le pont refuse un objet
-- parfaitement valide et laisse GetPlayers a nil.
local function reference(fn)
  return setmetatable({}, { __call = function(_, ...) return fn(...) end })
end

local across_the_boundary = {
  GetPlayerFromId = reference(function() return nil end),
  GetExtendedPlayers = reference(function() return {} end),
  RegisterUsableItem = reference(function() end),
}

local ok5, err5 = boot({ Agent = true, ox_inventory = true }, across_the_boundary)
check("un objet partage passe par la frontiere d'export est accepte", ok5, err5)
check(
  "et GetPlayers existe alors vraiment",
  ok5 and type(Bridge.Framework.GetPlayers) == "function",
  ok5 and type(Bridge.Framework.GetPlayers) or err5
)

-- 4. La garde de base mord.
local ok4 = boot({ ox_inventory = true }, make_shared_object())
check("sans Agent, le pont refuse de demarrer", not ok4)

if failures > 0 then
  print("  " .. failures .. " echec(s)")
  os.exit(1)
end

print("  pont degraisse : demarre, et refuse les trois cas invalides")
