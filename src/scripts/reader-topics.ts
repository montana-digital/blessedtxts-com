import { loadTopicsIndex, getTopicHits, listTopicIds, formatTopicLabel } from './search-core';
import { displayReaderHits } from './search-ui-reader';
import { showReaderError, clearReaderStatus } from '../lib/reader-status';

export async function initTopicsBrowse(
  translationId: string,
  translationLabel: string,
  routeSlug: string,
  onNavigate: (anchor: string, highlight: string | null) => void,
): Promise<void> {
  const container = document.getElementById('reader-topics-nav');
  if (!container) return;

  let topics;
  try {
    topics = await loadTopicsIndex();
  } catch (err) {
    container.innerHTML = '<p class="reader-sidebar-empty">Topics unavailable.</p>';
    throw err;
  }

  const ids = listTopicIds(topics);

  container.innerHTML = ids
    .map((id) => {
      const entry = topics[id];
      const kw = entry.keywords.slice(0, 3).join(', ');
      return `<button type="button" class="reader-topic-btn" data-topic="${id}" title="${kw}">${formatTopicLabel(id)}</button>`;
    })
    .join('');

  container.querySelectorAll('.reader-topic-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const topicId = (btn as HTMLElement).dataset.topic!;
      container.querySelectorAll('.reader-topic-btn').forEach((b) => {
        b.classList.toggle('is-active', b === btn);
      });
      const result = await getTopicHits(translationId, topicId);
      const label = formatTopicLabel(topicId);

      if (!result.ok) {
        showReaderError(result.error || 'Topics unavailable.');
        return;
      }

      clearReaderStatus();
      if (result.hits.length) {
        const input = document.getElementById('reader-search-input') as HTMLInputElement | null;
        if (input) input.value = topics[topicId].keywords[0] || label;
      }

      displayReaderHits(
        result.hits,
        {
          translationLabel,
          routeSlug,
          onNavigate,
          highlight: topics[topicId].keywords[0] || null,
          resultsTitle: `${label} (${result.hits.length} verses)`,
        },
        false,
      );

      document.getElementById('reader-search')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    });
  });
}
