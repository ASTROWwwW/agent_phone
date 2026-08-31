import type { BuiltinPhoneAppId } from '@/types/apps'

export type AppStorePreviewVisual = {
  accent: string
  surface: string
}

type PreviewableBuiltinAppId = Exclude<BuiltinPhoneAppId, 'app-store'>

const APP_STORE_PREVIEW_STYLES = {
  companies: { accent: '#4a92ff', surface: '#0c1728' },
  music: { accent: '#fa3d71', surface: '#240b19' },
  picstagram: { accent: '#e54cff', surface: '#210b27' },
  feather: { accent: '#3c9cff', surface: '#091c2d' },
  fliptok: { accent: '#24f0d2', surface: '#071d1b' },
  flare: { accent: '#ff567f', surface: '#260d18' },
  calendar: { accent: '#ff554d', surface: '#24100d' },
  phone: { accent: '#35d36f', surface: '#082016' },
  messages: { accent: '#42d66d', surface: '#082117' },
  darkchat: { accent: '#845eff', surface: '#120c27' },
  garage: { accent: '#4d9dff', surface: '#0a1828' },
  house: { accent: '#d4a25c', surface: '#21170c' },
  map: { accent: '#46c97c', surface: '#091f16' },
  agentride: { accent: '#f6c43d', surface: '#211a08' },
  banking: { accent: '#3dcc8b', surface: '#092019' },
  billing: { accent: '#4aa2ff', surface: '#09192a' },
  mail: { accent: '#52a8ff', surface: '#091a2b' },
  notes: { accent: '#ffd34e', surface: '#211b08' },
  memos: { accent: '#ff4f63', surface: '#250c13' },
  calculator: { accent: '#ff9e36', surface: '#231407' },
  camera: { accent: '#b7c0cd', surface: '#11151b' },
  clock: { accent: '#ff9d32', surface: '#251507' },
  weather: { accent: '#54baff', surface: '#091b29' },
  photos: { accent: '#ff5f75', surface: '#251015' },
  settings: { accent: '#8f99a8', surface: '#141820' },
  snake: { accent: '#59e16d', surface: '#071f0c' },
  'number-merge': { accent: '#f0a451', surface: '#241508' },
  'agent-flappy': { accent: '#55cfff', surface: '#081d26' },
  citymarkt: { accent: '#ff9a45', surface: '#241407' },
} satisfies Record<PreviewableBuiltinAppId, AppStorePreviewVisual>

const EXTERNAL_APP_PREVIEW: AppStorePreviewVisual = {
  accent: '#4d9dff',
  surface: '#0a1828',
}

export function getAppStorePreviewVisual(appId: string): AppStorePreviewVisual {
  if (appId === 'app-store') return EXTERNAL_APP_PREVIEW
  return (
    APP_STORE_PREVIEW_STYLES[appId as PreviewableBuiltinAppId] ??
    EXTERNAL_APP_PREVIEW
  )
}

export const PREVIEWABLE_BUILTIN_APP_IDS = Object.freeze(
  Object.keys(APP_STORE_PREVIEW_STYLES) as PreviewableBuiltinAppId[],
)
