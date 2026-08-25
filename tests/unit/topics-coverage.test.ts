import { describe, expect, it } from 'vitest';
import { loadTopicsIndex } from '../../src/lib/topic-seo';
import { TOPIC_LEADS } from '../../src/lib/topic-copy';
import path from 'path';

const ROOT = path.join(import.meta.dirname, '..', '..');

describe('topic coverage', () => {
  it('every topic has a unique lead and at least one KJV excerpt', () => {
    const topics = loadTopicsIndex(ROOT);
    const ids = Object.keys(topics);
    expect(ids.length).toBeGreaterThanOrEqual(20);
    for (const id of ids) {
      expect(TOPIC_LEADS[id], `missing lead for ${id}`).toBeTruthy();
      expect(topics[id].verses.kjv?.length ?? 0, `no KJV hits for ${id}`).toBeGreaterThan(0);
    }
  });
});
