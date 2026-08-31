import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'
import { resourceUrl } from './testing/resource'

const readResourceFile = (path: string) =>
  readFileSync(
    resourceUrl(`${path}`),
    'utf8',
  ).replace(/\r\n/g, '\n')
const readFrontendFile = (path: string) =>
  readFileSync(new URL(path, import.meta.url), 'utf8')

// La base Agent tourne sur ox_inventory. Les 16 autres adaptateurs ont ete
// retires : un adaptateur dont le fichier n'existe plus resterait
// selectionnable par la detection automatique, donc la table suit.
const inventoryAdapters = [
  ['ox', 'source/bridge/server/inventory/ox.lua'],
] as const

describe('phone inventory contracts', () => {
  it.each(inventoryAdapters)(
    'registers the phone as a usable item through the %s adapter',
    (_inventory, path) => {
      expect(readResourceFile(path)).toContain(
        'function Bridge.Inventory.RegisterUsableItem',
      )
    },
  )

  it('fails startup when the selected inventory cannot register the phone item', () => {
    const phoneServer = readResourceFile('source/server/phone.lua')

    expect(phoneServer).toContain(
      'Bridge.Inventory.RegisterUsableItem(item_name, function(...)',
    )
    expect(phoneServer).toContain('if Config.Phone.Item == item_name then')
    expect(phoneServer).toContain(
      'if not Bridge.Inventory.RegisterUsableItem(item_name, function(...)',
    )
  })

  it('serializes and rate-limits phone bootstrap requests on both sides', () => {
    const phoneClient = readResourceFile('source/client/main.lua')
    const phoneServer = readResourceFile('source/server/phone.lua')

    expect(phoneClient).toContain('local function request_phone_open(')
    expect(phoneClient).toMatch(
      /request_phone_open\(callback_name\)[\s\S]*?open_requested = true[\s\S]*?Bridge\.Callbacks\.Trigger\(callback_name, \{\}\)/,
    )
    expect(phoneClient).toMatch(
      /RegisterNetEvent\("agent_phone:device:error"[\s\S]*?if not is_open then[\s\S]*?open_requested = false/,
    )
    expect(phoneServer).toContain('local phone_open_in_progress = {}')
    expect(phoneServer).toContain(
      'AgentPhone.AllowOperation(source, "phone_open", request_limit, 60)',
    )
    expect(phoneServer).toContain(
      'pcall(perform_phone_open, source, used_item)',
    )
  })

  it('auto-detects ox_inventory and keeps the metadata downgrade path intact', () => {
    const inventoryBridge = readResourceFile(
      'source/bridge/server/inventory.lua',
    )

    expect(inventoryBridge).toContain(
      '{ name = "ox", resource = "ox_inventory" },',
    )
    expect(inventoryBridge).toContain(
      'GetResourceState(adapter.resource) == "started"',
    )
    expect(inventoryBridge).toContain('configured_inventory = adapter.name')
    expect(inventoryBridge).toContain('selected_adapter.metadata == false')
    expect(inventoryBridge).toContain('Config.Phone.Unique = false')
    expect(inventoryBridge).toContain('Config.Sim.Enabled = false')
    expect(inventoryBridge).toContain(
      'does not support item metadata; unique phones and physical SIM cards were disabled automatically',
    )
    expect(inventoryBridge).toContain(
      'AddEventHandler("agent_phone:configurator:serverUpdated"',
    )
    expect(inventoryBridge).not.toContain(
      'cannot store unique phone or physical SIM metadata',
    )
  })

  it('exposes the equipped phone number from authoritative device state', () => {
    const phoneClient = readResourceFile('source/client/main.lua')
    const phoneServer = readResourceFile('source/server/phone.lua')

    expect(phoneClient).toContain('return device_payload.device.sim.number')
    expect(phoneClient).toContain(
      'Bridge.Callbacks.Trigger("agent_phone:device:equipped-number", {})',
    )
    expect(phoneServer).toContain(
      'Bridge.Callbacks.Register("agent_phone:device:equipped-number", function(source)',
    )
    expect(phoneServer).toContain(
      'function AgentPhone.GetEquippedPhoneNumber(player)',
    )
    expect(phoneServer).toContain(
      'cache_equipped_phone_number(source, identifier, device.phone_number)',
    )
    expect(phoneServer).toContain(
      'equipped_phone_sources[phone_number] = source',
    )
    const equippedNumberExport = phoneServer.match(
      /function AgentPhone\.GetEquippedPhoneNumber\(player\)([\s\S]*?)\nfunction AgentPhone\.GetSourceFromNumber/,
    )?.[1]
    const equippedNumberResolver = phoneServer.match(
      /local function resolve_equipped_phone_number\(source\)([\s\S]*?)\nfunction AgentPhone\.GetEquippedPhoneNumber/,
    )?.[1]
    expect(equippedNumberExport).toBeDefined()
    expect(equippedNumberResolver).toBeDefined()
    expect(equippedNumberExport).toContain('type(player) == "number"')
    expect(equippedNumberExport).toContain(
      'online_source_for_identifier(player)',
    )
    expect(phoneServer).toContain(
      'Bridge.Inventory.GetSlotsWithItem(source, Config.Phone.Item)',
    )
    expect(phoneServer).toContain(
      'return resolve_equipped_phone_number(player)',
    )
    expect(equippedNumberExport).not.toContain('tonumber(player)')
    expect(equippedNumberExport).not.toContain('equipped_phone_numbers[player]')
    expect(equippedNumberResolver).not.toContain('return cached_number')
    expect(phoneServer).toContain(
      'player_source and resolve_equipped_phone_number(player_source) == normalized',
    )
    expect(phoneServer).toContain(
      'TriggerEvent("agent_phone:server:phoneNumberChanged", source, phone_number)',
    )
  })

  it('announces client lifecycle and state changes on the phone event bus', () => {
    const phoneClient = readResourceFile('source/client/main.lua')

    expect(phoneClient).toContain(
      'local result = Bridge.Callbacks.Trigger(callback_name, {})',
    )
    expect(phoneClient).toMatch(
      /result\.success == true[\s\S]*open_requested = false[\s\S]*open_without_focus = false[\s\S]*return false/,
    )
    expect(phoneClient).toContain(
      'TriggerEvent("agent_phone:client:phoneNumberChanged", next_number)',
    )
    expect(phoneClient).toContain(
      'TriggerEvent("agent_phone:client:phoneToggled", true)',
    )
    expect(phoneClient).toContain(
      'TriggerEvent("agent_phone:client:phoneToggled", false)',
    )
  })

  it('keeps vendor contracts outside the phone business core', () => {
    const corePaths = [
      'source/client/main.lua',
      'source/client/camera.lua',
      'source/client/custom_apps.lua',
      'source/server/phone.lua',
      'source/server/sim.lua',
      'source/server/media.lua',
    ]

    for (const path of corePaths) {
      expect(readResourceFile(path)).not.toMatch(
        /lb-phone|17mov|high-phone|qs-smartphone|yseries|AgentPhoneCompatibility/,
      )
    }
  })

  it('maps the custom-app delete lifecycle from the App Store to Lua', () => {
    const appStore = readFrontendFile('stores/app-store.ts')
    const customApps = readResourceFile('source/client/custom_apps.lua')

    expect(appStore).toContain("event: 'delete'")
    expect(customApps).toContain('and lifecycle_event ~= "delete"')
    expect(customApps).toContain(
      'invoke_or_defer_hook(app, "onDelete", lifecycle_payload, deferred_hooks)',
    )
  })

  it('emits exact LB observer events after authoritative state changes', () => {
    const phonePersistence = readResourceFile(
      'source/server/phone_persistence.lua',
    )
    const simServer = readResourceFile('source/server/sim.lua')
    const mediaServer = readResourceFile('source/server/media.lua')
    const phoneBridge = readResourceFile(
      'source/bridge/phones/server/lifecycle.lua',
    )

    expect(simServer).toContain(
      'TriggerEvent("agent_phone:server:phoneNumberGenerated", source, sim.phone_number)',
    )
    expect(phonePersistence).toContain(
      'TriggerEvent("agent_phone:server:factoryReset", source, phone_number)',
    )
    expect(mediaServer).toContain(
      'TriggerEvent("agent_phone:server:galleryMediaDeleted", src, phone_number, deleted_link)',
    )
    expect(phoneBridge).toContain(
      'TriggerEvent("lb-phone:phoneNumberGenerated"',
    )
    expect(phoneBridge).toContain('TriggerEvent("lb-phone:factoryReset"')
    expect(phoneBridge).toContain('TriggerEvent("lb-phone:deletedFromGallery"')
  })

  it('keeps the phone key mapping command stable so FiveM user rebindings persist', () => {
    const config = readResourceFile('config/config.lua')
    const phoneClient = readResourceFile('source/client/main.lua')
    const phoneServer = readResourceFile('source/server/phone.lua')

    expect(config).toContain('Keybind = "F1"')
    expect(phoneClient).toContain('local phone_key_mapping_registered = false')
    expect(phoneClient).toContain('refresh_phone_key_mapping = function()')
    expect(phoneClient).toMatch(
      /RegisterKeyMapping\(\s*"agent_phone_toggle",\s*locale\.Controls\.OpenPhone,\s*"keyboard",\s*key_name\s*\)/,
    )
    expect(phoneClient).not.toContain('agent_phone_toggle_config_')
    expect(phoneClient).not.toContain('key_mapping_revision')
    expect(phoneClient).toContain(
      'request_phone_open("agent_phone:device:open-request")',
    )
    expect(phoneServer).toContain(
      'Bridge.Callbacks.Register("agent_phone:device:open-request", function(source)',
    )
  })

  it('applies development command changes immediately without a resource restart', () => {
    const phoneClient = readResourceFile('source/client/main.lua')

    expect(phoneClient).toContain('local active_development_command = nil')
    expect(phoneClient).toContain('refresh_development_command = function()')
    expect(phoneClient).toContain(
      'local command_name = Config.Phone.DevelopmentCommand and Config.Command or nil',
    )
    expect(phoneClient).toContain('RegisterCommand(command_name, function()')
    expect(phoneClient).toContain(
      'if active_development_command == command_name and Config.Phone.DevelopmentCommand then',
    )
    expect(phoneClient).toContain(
      'TriggerEvent("chat:removeSuggestion", "/" .. active_development_command)',
    )
    expect(phoneClient).toMatch(
      /AddEventHandler\("agent_phone:configurator:updated", function\(\)[\s\S]*?refresh_development_command\(\)/,
    )
  })

  it('opens a running live activity with Space without affecting normal gameplay', () => {
    const phoneClient = readResourceFile('source/client/main.lua')

    expect(phoneClient).toContain(
      'RegisterCommand("agent_phone_live_activity_open"',
    )
    expect(phoneClient).toContain(
      'if not live_activity_active or is_open or open_requested then',
    )
    expect(phoneClient).toContain(
      'RegisterKeyMapping(\n    "agent_phone_live_activity_open"',
    )
    expect(phoneClient).toContain('"SPACE"')
    expect(phoneClient).toContain('RegisterNUICallback("ui:live-activity"')
  })

  it('keeps a server-selected unique handset as the preferred hotkey device', () => {
    const phoneServer = readResourceFile('source/server/phone.lua')

    expect(phoneServer).toContain('local preferred_device_imeis = {}')
    expect(phoneServer).toContain(
      'local preferred_imei = preferred_device_imeis[source]',
    )
    expect(phoneServer).toContain('preferred_device_imeis[source] = imei')
  })

  it('keeps non-unique phones bound to one persistent device per character', () => {
    const phoneServer = readResourceFile('source/server/phone.lua')
    const migration = readResourceFile('source/server/db_migrate.lua')

    expect(phoneServer).toContain('if Config.Phone.Unique == false then')
    expect(phoneServer).toContain('return map_character_device(source, slot)')
    expect(phoneServer).toContain('FROM `agent_phone_character_devices`')
    expect(phoneServer).toContain('WHERE `owner_identifier` = ?')
    expect(migration).toContain('name = "agent_phone_character_devices"')
    expect(migration).toContain('primaryKey = "owner_identifier"')
  })
})
