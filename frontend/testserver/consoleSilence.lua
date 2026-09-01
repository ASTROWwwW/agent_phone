-- Verifie que la ressource se tait, et qu'elle reparle si on le demande.
local root = ...

local printed = {}
local real_print = print
print = function(...)
  local parts = {}
  for index = 1, select('#', ...) do
    parts[#parts + 1] = tostring((select(index, ...)))
  end
  printed[#printed + 1] = table.concat(parts, ' ')
end

Config = { Bridge = { Debug = false } }
Bridge = {}

assert(loadfile(root .. '/source/bridge/shared.lua'))()

Bridge.Debug('error', 'une erreur')
Bridge.Debug('warn', 'un avertissement')
Bridge.Debug('info', 'une information')
Bridge.Debug('debug', 'un detail')
Bridge.Debug('warn', 'un avis force', { notice = true })

local silent = #printed

Config.Bridge.Debug = true
Bridge.Debug('warn', 'avec le diagnostic actif')
local afterEnable = #printed

print = real_print

print('  messages emis, silence  : ' .. silent)
print('  messages emis, actif    : ' .. (afterEnable - silent))

if silent ~= 0 then
  print('  ECHEC : la ressource parle encore')
  for _, line in ipairs(printed) do print('    ' .. line) end
  os.exit(1)
end

if afterEnable - silent ~= 1 then
  print('  ECHEC : le diagnostic ne reparle pas')
  os.exit(1)
end

print('  silence complet, et reversible')
