-- Verifie la resolution des permissions avec des joueurs simules, tels que la
-- base les construit : un champ admin calcule depuis ses propres groupes.
local root = ...

local PLAYERS = {
  [1] = { admin = true, group = 'fondateur' },
  [2] = { admin = true, group = 'helper' },
  [3] = { admin = true, group = 'admin' },
  [4] = { admin = false, group = 'user' },
  [5] = { admin = false, group = 'police' },
}

local STARTED = { Agent = true, ox_inventory = true }
function GetCurrentResourceName() return 'agent_phone' end
function GetResourceState(name) return STARTED[name] and 'started' or 'missing' end
function IsDuplicityVersion() return true end
function GetConvar(_, fallback) return fallback end
function CreateThread() end
function Wait() end
function AddEventHandler() end
function RegisterNetEvent() end
function TriggerEvent() end
function vector3(x, y, z) return { x = x, y = y, z = z } end

local ESX_STUB = {
  GetPlayerFromId = function(source)
    local data = PLAYERS[source]
    if not data then return nil end
    return {
      admin = data.admin,
      getGroup = function() return data.group end,
    }
  end,
  GetExtendedPlayers = function() return {} end,
  RegisterUsableItem = function() end,
}

exports = setmetatable({}, {
  __index = function()
    return setmetatable({ getSharedObject = function() return ESX_STUB end }, {
      __index = function() return function() return nil end end,
    })
  end,
})

Config = {}
Bridge = { Framework = {}, Database = {}, Inventory = {} }
Bridge.Debug = function() end

assert(loadfile(root .. '/config/config.lua'))()
assert(loadfile(root .. '/source/bridge/server/framework.lua'))()

local failures = 0
local function check(label, actual, expected)
  if actual ~= expected then
    print(('  ECHEC %s : attendu %s, obtenu %s'):format(label, tostring(expected), tostring(actual)))
    failures = failures + 1
  else
    print(('  %-34s %s'):format(label, actual and 'autorise' or 'refuse'))
  end
end

check('fondateur -> phonepanel', Bridge.Framework.HasPermission(1, 'phonepanel'), true)
check('helper -> phonepanel', Bridge.Framework.HasPermission(2, 'phonepanel'), true)
check('admin -> phonepanel', Bridge.Framework.HasPermission(3, 'phonepanel'), true)
check('joueur -> phonepanel', Bridge.Framework.HasPermission(4, 'phonepanel'), false)
check('policier -> phonepanel', Bridge.Framework.HasPermission(5, 'phonepanel'), false)

-- Un groupe nomme doit continuer de fonctionner, pour restreindre plus finement.
Config.CommandPermissions.testfine = { 'fondateur' }
check('groupe nomme : fondateur', Bridge.Framework.HasPermission(1, 'testfine'), true)
check('groupe nomme : helper refuse', Bridge.Framework.HasPermission(2, 'testfine'), false)

check('IsAdmin(helper)', Bridge.Framework.IsAdmin(2), true)
check('IsAdmin(joueur)', Bridge.Framework.IsAdmin(4), false)

print('')
if failures > 0 then
  print('  ' .. failures .. ' echec(s)')
  os.exit(1)
end
print('  toutes les resolutions sont correctes')
