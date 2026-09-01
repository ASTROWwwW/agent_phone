<script setup lang="ts">
import {
  Ellipsis,
  Pin,
  PinOff,
  Share2,
  SquarePen,
  Trash2,
} from 'lucide-vue-next'
import { computed, ref } from 'vue'

import NotesRichTextEditor from '@/components/NotesRichTextEditor.vue'
import { useNotesStore } from '@/stores/notes'
import { useEasyShareStore } from '@/stores/easyshare'
import { usePhoneStore } from '@/stores/phone'
import {
  SkyActionSheet,
  SkyAppPage,
  SkyBlock,
  SkyBlockTitle,
  SkyButton,
  SkyDialog,
  SkyDialogButton,
  SkyFab,
  SkyLink,
  SkyList,
  SkyListButton,
  SkyListItem,
  SkyNavbar,
  SkyNavbarBackLink,
  SkyScrollArea,
  SkySearchbar,
  SkyToolbar,
} from '@/ui'
import type { Note } from '@/utils/notes'
import { noteBodyToPlainText } from '@/utils/noteRichText'

const phone = usePhoneStore()
const notes = useNotesStore()
const easyShare = useEasyShareStore()
const searchQuery = ref('')
const editorId = ref<string | null>(null)
const editorOpened = ref(false)
const draftBody = ref('')
const menuOpened = ref(false)
const listDeleteCandidateId = ref<string | null>(null)
const currentNote = computed(() =>
  editorId.value
    ? notes.notes.find((note) => note.id === editorId.value)
    : undefined,
)

const visibleNotes = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase(phone.lang)
  return [...notes.notes]
    .filter((note) => {
      if (!query) return true
      return `${note.title}\n${noteBodyToPlainText(note.body)}`
        .toLocaleLowerCase(phone.lang)
        .includes(query)
    })
    .sort(
      (left, right) =>
        Number(right.pinned) - Number(left.pinned) ||
        right.updatedAt - left.updatedAt,
    )
})
type NoteGroup = {
  id: string
  label: string
  notes: Note[]
}

const DAY_MS = 86_400_000

/*
 * Notes d'iOS ne presente pas une liste plate : les epingles ouvrent la page,
 * puis les notes se rangent par anciennete. Le decoupage se fait sur le debut
 * du jour local, pas sur des multiples de 24 h, sinon une note d'hier soir
 * bascule dans « Aujourd'hui » selon l'heure a laquelle on regarde.
 */
function startOfToday(): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today.getTime()
}

const noteGroups = computed<NoteGroup[]>(() => {
  const midnight = startOfToday()
  const buckets: NoteGroup[] = [
    { id: 'pinned', label: phone.t('Apps.notes.groups.pinned'), notes: [] },
    { id: 'today', label: phone.t('Apps.notes.groups.today'), notes: [] },
    {
      id: 'yesterday',
      label: phone.t('Apps.notes.groups.yesterday'),
      notes: [],
    },
    {
      id: 'previous7Days',
      label: phone.t('Apps.notes.groups.previous7Days'),
      notes: [],
    },
    {
      id: 'previous30Days',
      label: phone.t('Apps.notes.groups.previous30Days'),
      notes: [],
    },
    { id: 'earlier', label: phone.t('Apps.notes.groups.earlier'), notes: [] },
  ]
  const byId = new Map(buckets.map((bucket) => [bucket.id, bucket]))

  for (const note of visibleNotes.value) {
    if (note.pinned) {
      byId.get('pinned')?.notes.push(note)
      continue
    }
    const age = midnight - note.updatedAt
    const bucketId =
      age < 0
        ? 'today'
        : age < DAY_MS
          ? 'yesterday'
          : age < 7 * DAY_MS
            ? 'previous7Days'
            : age < 30 * DAY_MS
              ? 'previous30Days'
              : 'earlier'
    byId.get(bucketId)?.notes.push(note)
  }

  return buckets.filter((bucket) => bucket.notes.length > 0)
})

const noteCountLabel = computed(() =>
  visibleNotes.value.length === 1
    ? phone.t('Apps.notes.oneNote')
    : phone.t('Apps.notes.noteCount', {
        count: String(visibleNotes.value.length),
      }),
)

const editorLabels = computed(() => ({
  bold: phone.t('Apps.notes.tools.bold'),
  bulletList: phone.t('Apps.notes.tools.bulletList'),
  closeFormatting: phone.t('Common.close'),
  decreaseText: phone.t('Apps.notes.tools.decreaseText'),
  increaseText: phone.t('Apps.notes.tools.increaseText'),
  italic: phone.t('Apps.notes.tools.italic'),
  numberedList: phone.t('Apps.notes.tools.numberedList'),
  quote: phone.t('Apps.notes.tools.quote'),
  redo: phone.t('Apps.notes.tools.redo'),
  strike: phone.t('Apps.notes.tools.strike'),
  toolbar: phone.t('Apps.notes.tools.toolbar'),
  underline: phone.t('Apps.notes.tools.underline'),
  undo: phone.t('Apps.notes.tools.undo'),
}))

function noteTitle(note: Note): string {
  return note.title.trim() || phone.t('Apps.notes.untitled')
}

function notePreview(note: Note): string {
  return (
    noteBodyToPlainText(note.body).trim().replace(/\s+/g, ' ') ||
    phone.t('Apps.notes.noText')
  )
}

function noteDate(note: Note): string {
  const date = new Date(note.updatedAt)
  const sameYear = date.getFullYear() === new Date().getFullYear()
  return new Intl.DateTimeFormat(phone.lang, {
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
  }).format(date)
}

function noteSubtitle(note: Note): string {
  return `${noteDate(note)} · ${notePreview(note)}`
}

function titleFromDraftBody(body: string): string {
  return noteBodyToPlainText(body).split('\n')[0]?.trim() ?? ''
}

function createNote(): void {
  editorId.value = null
  draftBody.value = ''
  editorOpened.value = true
}

function editNote(note: Note): void {
  editorId.value = note.id
  draftBody.value = note.body
  editorOpened.value = true
}

function requestListDelete(note: Note): void {
  listDeleteCandidateId.value = note.id
}

function cancelListDelete(): void {
  listDeleteCandidateId.value = null
}

function confirmListDelete(): void {
  const noteId = listDeleteCandidateId.value
  if (!noteId) return
  notes.deleteNote(noteId)
  listDeleteCandidateId.value = null
}

function persistDraft(): Note | undefined {
  const draft = {
    body: draftBody.value,
    title:
      titleFromDraftBody(draftBody.value) ||
      currentNote.value?.title.trim() ||
      '',
  }

  if (editorId.value) {
    notes.updateNote(editorId.value, draft)
    return notes.notes.find((note) => note.id === editorId.value)
  }
  if (!draft.title && !noteBodyToPlainText(draft.body).trim()) return undefined

  const note = notes.createNote(draft)
  editorId.value = note.id
  return note
}

function saveAndClose(): void {
  persistDraft()
  menuOpened.value = false
  editorOpened.value = false
}

function openMenu(): void {
  if (!persistDraft()) return
  menuOpened.value = true
}

function deleteNote(): void {
  const note = persistDraft()
  if (!note) return
  notes.deleteNote(note.id)
  menuOpened.value = false
  editorOpened.value = false
}

function togglePinned(): void {
  const note = persistDraft()
  if (!note) return
  notes.togglePinned(note.id)
  menuOpened.value = false
}

function shareNote(): void {
  const note = persistDraft()
  if (!note) return
  menuOpened.value = false
  easyShare.open({
    appId: 'notes',
    copyText: noteBodyToPlainText(note.body) || note.title,
    id: note.id,
    kind: 'note',
    subtitle: notePreview(note),
    title: noteTitle(note),
  })
}
</script>

<template>
  <sky-app-page
    v-if="!editorOpened"
    class="notes-list-page sky-ui-provider"
    :class="{ 'sky-ui-provider--dark': phone.isDarkMode }"
    :aria-label="phone.t('Apps.notes.name')"
  >
    <sky-navbar
      class="notes-list-navbar"
      variant="large"
      transparent
      :title="phone.t('Apps.notes.name')"
    />

    <SkyScrollArea as="main" class="notes-list-scroll">
      <template v-if="visibleNotes.length">
        <section
          v-for="group in noteGroups"
          :key="group.id"
          class="notes-group"
        >
          <h2 class="notes-group__title sky-type-display">
            <Pin v-if="group.id === 'pinned'" :size="12" aria-hidden="true" />
            {{ group.label }}
          </h2>
          <div class="notes-group__card">
            <article
              v-for="note in group.notes"
              :key="note.id"
              class="notes-row"
            >
              <button
                class="notes-row__open"
                type="button"
                @click="editNote(note)"
              >
                <span class="notes-row__title sky-type-display">{{
                  noteTitle(note)
                }}</span>
                <span class="notes-row__meta">
                  <time class="notes-row__date">{{ noteDate(note) }}</time>
                  <span class="notes-row__preview">{{
                    notePreview(note)
                  }}</span>
                </span>
              </button>
              <button
                class="notes-row__delete"
                type="button"
                :aria-label="phone.t('Apps.notes.deleteNote')"
                @click.stop="requestListDelete(note)"
              >
                <Trash2 :size="17" aria-hidden="true" />
              </button>
            </article>
          </div>
        </section>
        <p class="notes-count">{{ noteCountLabel }}</p>
      </template>

      <template v-else>
        <sky-block-title large>{{
          phone.t(
            searchQuery ? 'Apps.notes.noResults' : 'Apps.notes.emptyTitle',
          )
        }}</sky-block-title>
        <sky-block strong inset>{{
          phone.t(
            searchQuery ? 'Apps.notes.noResultsBody' : 'Apps.notes.emptyBody',
          )
        }}</sky-block>
        <sky-list v-if="!searchQuery" strong inset>
          <sky-list-button link-component="button" @click="createNote">
            {{ phone.t('Apps.notes.newNote') }}
          </sky-list-button>
        </sky-list>
      </template>
    </SkyScrollArea>

    <SkyToolbar
      class="notes-composer"
      component="footer"
      :aria-label="phone.t('Apps.notes.searchPlaceholder')"
    >
      <SkySearchbar
        v-model="searchQuery"
        :clear-label="phone.t('Common.clear')"
        :label="phone.t('Apps.notes.searchPlaceholder')"
        :placeholder="phone.t('Apps.notes.searchPlaceholder')"
      />
      <SkyFab
        :aria-label="phone.t('Apps.notes.newNote')"
        variant="glass"
        @click="createNote"
      >
        <template #icon>
          <SquarePen :size="21" aria-hidden="true" />
        </template>
      </SkyFab>
    </SkyToolbar>

    <SkyDialog
      :opened="listDeleteCandidateId !== null"
      :title="phone.t('Apps.notes.deleteTitle')"
      :content="phone.t('Apps.notes.deleteBody')"
      role="alertdialog"
      @backdropclick="cancelListDelete"
      @escape="cancelListDelete"
    >
      <template #buttons>
        <SkyDialogButton @click="cancelListDelete">
          {{ phone.t('Common.cancel') }}
        </SkyDialogButton>
        <SkyDialogButton
          strong
          class="notes-delete-confirm"
          @click="confirmListDelete"
        >
          {{ phone.t('Common.delete') }}
        </SkyDialogButton>
      </template>
    </SkyDialog>
  </sky-app-page>

  <sky-app-page v-else class="notes-editor-page !pb-0">
    <sky-navbar :title="phone.t('Apps.notes.note')">
      <template #left>
        <sky-navbar-back-link
          component="button"
          :text="phone.t('Apps.notes.back')"
          :aria-label="phone.t('Apps.notes.back')"
          @click="saveAndClose"
        />
      </template>
      <template #right>
        <sky-link
          component="button"
          icon-only
          :aria-label="phone.t('Apps.notes.actions')"
          @click="openMenu"
        >
          <Ellipsis :size="22" />
        </sky-link>
      </template>
    </sky-navbar>

    <div class="notes-editor-layout">
      <NotesRichTextEditor
        v-model="draftBody"
        :dark="phone.isDarkMode"
        :labels="editorLabels"
        :placeholder="phone.t('Apps.notes.bodyPlaceholder')"
      />
    </div>

    <SkyActionSheet
      class="notes-action-sheet sky-ui-provider"
      :class="{ 'sky-ui-provider--dark': phone.isDarkMode }"
      :aria-label="phone.t('Apps.notes.actions')"
      :opened="menuOpened"
      @backdropclick="menuOpened = false"
      @escape="menuOpened = false"
    >
      <div class="notes-action-menu">
        <div class="notes-action-menu__choices">
          <SkyButton block large tonal @click="shareNote">
            <Share2 :size="19" aria-hidden="true" />
            {{ phone.t('Apps.easyShare.name') }}
          </SkyButton>
          <SkyButton block large tonal @click="togglePinned">
            <PinOff v-if="currentNote?.pinned" :size="19" aria-hidden="true" />
            <Pin v-else :size="19" aria-hidden="true" />
            {{
              phone.t(
                currentNote?.pinned ? 'Apps.notes.unpin' : 'Apps.notes.pin',
              )
            }}
          </SkyButton>
          <SkyButton
            block
            class="notes-action-menu__danger"
            large
            tonal
            @click="deleteNote"
          >
            <Trash2 :size="19" aria-hidden="true" />
            {{ phone.t('Apps.notes.deleteNote') }}
          </SkyButton>
        </div>
        <SkyButton block clear large @click="menuOpened = false">
          {{ phone.t('Common.cancel') }}
        </SkyButton>
      </div>
    </SkyActionSheet>
  </sky-app-page>
</template>

<style scoped>
.notes-list-page {
  padding-bottom: 0 !important;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

:deep(.notes-list-navbar.sky-navbar--large) {
  min-height: calc(
    var(--sky-navbar-safe-area-top) + var(--sky-navbar-large-title-height)
  );
}

:deep(.notes-list-navbar.sky-navbar--large.sky-navbar--no-navigation) {
  padding-top: calc(var(--sky-navbar-safe-area-top) + var(--sky-space-3));
}

/* Liste facon Notes d'iOS : sections par anciennete, carte par section,
   filets internes decales et une seule ligne date + apercu par note. */
.notes-group {
  margin: 0 var(--sky-page-gutter) var(--sky-space-5);
}

.notes-group:first-child {
  margin-top: var(--sky-space-2);
}

.notes-group__title {
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 0 0 7px 4px;
  color: var(--sky-muted);
  font-size: 13px;
  font-weight: 600;
}

.notes-group__card {
  overflow: hidden;
  border-radius: 12px;
  background: var(--sky-surface);
  box-shadow: 0 1px 3px rgb(0 0 0 / 6%);
}

.notes-row {
  position: relative;
  display: flex;
  align-items: stretch;
}

.notes-row + .notes-row::before {
  position: absolute;
  top: 0;
  right: 0;
  left: 16px;
  height: 1px;
  background: var(--sky-hairline);
  content: '';
  transform: scaleY(var(--sky-hairline-scale));
  transform-origin: top;
}

.notes-row__open {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 11px 6px 11px 16px;
  border: 0;
  color: var(--sky-text);
  background: transparent;
  text-align: left;
}

.notes-row__open:active {
  background: var(--sky-pressed);
}

.notes-row__title {
  overflow: hidden;
  font-size: 16px;
  font-weight: 600;
  line-height: 21px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notes-row__meta {
  display: flex;
  min-width: 0;
  gap: 6px;
  color: var(--sky-muted);
  font-size: 14px;
  line-height: 19px;
}

.notes-row__date {
  flex: none;
}

.notes-row__preview {
  min-width: 0;
  overflow: hidden;
  opacity: 0.78;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notes-row__delete {
  display: grid;
  width: 44px;
  flex: none;
  border: 0;
  color: var(--sky-subtle);
  background: transparent;
  place-items: center;
  transition: color 160ms ease;
}

.notes-row__delete:active {
  color: var(--sky-danger);
}

.notes-count {
  margin: 0 0 var(--sky-space-4);
  color: var(--sky-subtle);
  font-size: 13px;
  text-align: center;
}

.notes-delete-confirm {
  color: var(--sky-danger);
  background: var(--sky-danger-soft);
}

.notes-editor-page {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.notes-editor-layout {
  min-height: 0;
  display: flex;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
}

.notes-action-menu {
  display: grid;
  gap: 8px;
  padding: 14px;
  border: 1px solid var(--sky-hairline);
  border-radius: 28px 28px 0 0;
  background: var(--sky-surface);
  box-shadow: 0 -18px 50px rgb(0 0 0 / 32%);
}

.notes-action-menu__choices {
  display: grid;
  gap: 8px;
}

.notes-action-menu :deep(.sky-button) {
  justify-content: center;
  border-radius: var(--sky-radius-control);
}

.notes-action-menu__danger {
  color: var(--sky-danger);
  background: var(--sky-danger-soft);
}

.notes-action-sheet :deep(.sky-action-sheet__panel) {
  max-height: none;
  padding: 0;
}
</style>
