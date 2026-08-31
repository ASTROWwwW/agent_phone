import { describe, expect, it } from 'vitest'

import type { EasySharePayload } from '@/types/easyshare'
import {
  easyShareDarkChatInviteCode,
  easyShareDestinationAppIds,
  easyShareMusicTarget,
  easyShareRoute,
} from '@/utils/easyshare'

function payload(overrides: Partial<EasySharePayload>): EasySharePayload {
  return {
    appId: 'notes',
    copyText: 'Shared content',
    kind: 'note',
    title: 'Shared content',
    ...overrides,
  }
}

describe('EasyShare deep links', () => {
  it.each([
    ['agentphone://media/42', '/apps/photos'],
    ['agentphone://location/current', '/apps/map'],
    ['agentphone://phone/5550142', '/apps/phone'],
    ['agentphone://music/server/night-drive', '/apps/music'],
    ['agentphone://citymarkt/listing/listing-1', '/apps/citymarkt'],
  ])('routes %s into its source app', (link, path) => {
    expect(easyShareRoute(payload({ link })).path).toBe(path)
  })

  it('falls back to the payload app and preserves share context', () => {
    expect(
      easyShareRoute(payload({ appId: 'calendar', id: 'event-1' })),
    ).toEqual({
      path: '/apps/calendar',
      query: {
        easyShareId: 'event-1',
        easyShareKind: 'note',
        easyShareLink: '',
      },
    })
  })

  it('opens CityMarkt links on the referenced listing', () => {
    expect(
      easyShareRoute(
        payload({
          appId: 'citymarkt',
          id: 'listing-1',
          kind: 'link',
          link: 'agentphone://citymarkt/listing/listing-1',
        }),
      ).query.listingId,
    ).toBe('listing-1')
  })

  it.each([
    ['picstagram', 'post', 'pic-post-1', '/apps/picstagram'],
    ['picstagram', 'profile', 'pic-profile-1', '/apps/picstagram'],
    ['feather', 'post', 'feather-post-1', '/apps/feather'],
    ['fliptok', 'post', 'fliptok-1', '/apps/fliptok'],
  ])('preserves the exact %s %s target', (appId, kind, id, path) => {
    expect(
      easyShareRoute(
        payload({
          appId: appId as EasySharePayload['appId'],
          id,
          kind: kind as EasySharePayload['kind'],
          link: `agentphone://${appId}/${kind}/${id}`,
        }),
      ),
    ).toMatchObject({
      path,
      query: { easyShareId: id, easyShareKind: kind },
    })
  })

  it('extracts a private DarkChat invitation from its profile share', () => {
    expect(
      easyShareDarkChatInviteCode(
        'profile',
        'agentphone://darkchat/invite/dc-7x4k-nova',
      ),
    ).toBe('DC-7X4K-NOVA')
    expect(
      easyShareDarkChatInviteCode(
        'link',
        'agentphone://darkchat/invite/DC-7X4K-NOVA',
      ),
    ).toBeNull()
    expect(
      easyShareDarkChatInviteCode('profile', 'agentphone://darkchat/invite/bad'),
    ).toBeNull()
  })

  it.each([
    [
      'track',
      'agentphone://music/server/city-after-dark',
      { id: 'city-after-dark', kind: 'track', source: 'server' },
    ],
    [
      'track',
      'agentphone://music/youtube/music-youtube-1',
      { id: 'music-youtube-1', kind: 'track', source: 'youtube' },
    ],
    [
      'playlist',
      'agentphone://music/playlist/music-playlist-1',
      { id: 'music-playlist-1', kind: 'playlist' },
    ],
  ] as const)(
    'extracts the exact shared music target',
    (kind, link, target) => {
      expect(easyShareMusicTarget(kind, link)).toEqual(target)
    },
  )

  it('rejects mismatched music share kinds', () => {
    expect(
      easyShareMusicTarget(
        'playlist',
        'agentphone://music/server/city-after-dark',
      ),
    ).toBeNull()
  })
})

describe('EasyShare destination suggestions', () => {
  it.each(['document', 'link', 'location', 'note', 'text'] as const)(
    'offers Notes for %s content from another app',
    (kind) => {
      expect(
        easyShareDestinationAppIds(payload({ appId: 'calendar', kind })),
      ).toEqual(['messages', 'darkchat', 'flare', 'notes'])
    },
  )

  it.each([
    'contact',
    'photo',
    'playlist',
    'post',
    'profile',
    'track',
    'video',
  ] as const)(
    'does not suggest lossy Notes conversion for %s content',
    (kind) => {
      expect(easyShareDestinationAppIds(payload({ kind }))).toEqual([
        'messages',
        'darkchat',
        'flare',
      ])
    },
  )

  it('does not suggest saving a Notes item back into Notes', () => {
    expect(easyShareDestinationAppIds(payload({}))).toEqual([
      'messages',
      'darkchat',
      'flare',
    ])
  })
})
