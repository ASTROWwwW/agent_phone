import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'
import { resourceUrl } from './testing/resource'

const manifest = readFileSync(
  resourceUrl('fxmanifest.lua'),
  'utf8',
)
const config = readFileSync(
  resourceUrl('config/config.lua'),
  'utf8',
)
const sharedBridge = readFileSync(
  resourceUrl('source/bridge/shared.lua'),
  'utf8',
)
const clientCalls = readFileSync(
  resourceUrl('source/bridge/client/calls.lua'),
  'utf8',
)
const clientNuiBridge = readFileSync(
  resourceUrl('source/client/nui_server_bridge.lua'),
  'utf8',
)
const phoneApp = readFileSync(
  new URL('./views/apps/PhoneApp.vue', import.meta.url),
  'utf8',
)
const serverCalls = readFileSync(
  resourceUrl('source/server/calls.lua'),
  'utf8',
)
const serverVoice = readFileSync(
  resourceUrl('source/bridge/server/voice.lua'),
  'utf8',
)

describe('voice provider contracts', () => {
  it('loads the provider bridges before their call consumers', () => {
    expect(manifest.indexOf("'source/bridge/client/calls.lua'")).toBeLessThan(
      manifest.indexOf("'source/client/payphones.lua'"),
    )
    expect(manifest.indexOf("'source/bridge/server/voice.lua'")).toBeLessThan(
      manifest.indexOf("'source/server/calls.lua'"),
    )
  })

  it('owns SaltyChat call membership and phone speaker state on the server', () => {
    expect(serverVoice).toContain('exports.saltychat:AddPlayersToCall')
    expect(serverVoice).toContain('exports.saltychat:RemovePlayersFromCall')
    expect(serverVoice).toContain('exports.saltychat:SetPhoneSpeaker')
    expect(serverCalls).toContain(
      'Bridge.Callbacks.Register("agent_phone:calls:set-speaker"',
    )
    expect(serverCalls).toContain('local call_id = active_by_source[source]')
    expect(serverCalls).toContain('call.id ~= data.id')
    expect(serverCalls).toContain('Bridge.Calls.Stop(')
    expect(serverCalls).toMatch(
      /call\.speakers\[source\] = data\.enabled\s+send_state\(call, source, "connected", call\.channel\)/,
    )
    expect(clientNuiBridge).toMatch(/calls\s*=\s*\[\[[^\]]*set-speaker/)
  })

  it('supports one global server-authoritative speaker switch', () => {
    expect(config).toMatch(/Config\.Speaker\s*=\s*\{\s*Enabled\s*=\s*true,/)
    expect(sharedBridge).toContain('function Bridge.Speaker.IsEnabled()')
    expect(clientCalls).toContain(
      'Bridge.Speaker.IsEnabled() and (selected == "yaca" or selected == "saltychat")',
    )
    expect(serverVoice).toContain(
      'Bridge.Speaker.IsEnabled() and (selected == "yaca" or selected == "saltychat")',
    )
    expect(serverCalls).toContain('if not Bridge.Speaker.IsEnabled() then')
  })

  it('integrates Yaca calls, speaker mode and provider-backed mute end to end', () => {
    expect(clientCalls).toContain('yaca = "yaca-voice"')
    expect(clientCalls).toContain('["yaca-voice"] = "yaca"')
    expect(serverVoice).toContain(
      'exports["yaca-voice"]:callPlayer(caller_source, target_source, true)',
    )
    expect(serverVoice).toContain(
      'exports["yaca-voice"]:callPlayer(caller_source, target_source, false)',
    )
    expect(serverVoice).toContain('exports["yaca-voice"]:enablePhoneSpeaker(')
    expect(serverVoice).toContain('exports["yaca-voice"]:muteOnPhone(')
    expect(serverCalls).toContain(
      'Bridge.Callbacks.Register("agent_phone:calls:set-muted"',
    )
    expect(clientNuiBridge).toMatch(/calls\s*=\s*\[\[[^\]]*set-muted/)
    expect(phoneApp).toContain('@click="toggleCallMute"')
    expect(phoneApp).not.toContain('callMuted = !callMuted')
  })

  it('supports explicit automatic call-provider discovery on client and server', () => {
    expect(config).toMatch(/\bVoiceProvider = "pma"/)
    expect(clientCalls).toContain('if configured == "auto" then')
    expect(serverVoice).toContain('if configured == "auto" then')
    expect(clientCalls).toContain(
      'for _, candidate in ipairs({ "yaca", "pma", "saltychat" }) do',
    )
    expect(serverVoice).toContain(
      'for _, candidate in ipairs({ "yaca", "pma", "saltychat" }) do',
    )
  })

})
