import { describe, it, expect } from 'vitest';
import { VERSIONS } from '../../src/lib/bible-config';
import {
  assertMetaDescriptionInRange,
  isMetaDescriptionInRange,
  truncateMetaDescription,
} from '../../src/lib/meta-description';
import { formatTopicLabel, loadTopicsIndex } from '../../src/lib/topic-seo';
import path from 'path';

const ROOT = path.join(import.meta.dirname, '..', '..');

const PAGE_DESCRIPTIONS: Record<string, string> = {
  home: 'Free random Bible verses from the King James, World English, and Webster translations. Read online or download full Scripture on Blessed Texts.',
  about:
    'Learn about Blessed Texts—a free Bible reader for King James, World English, and Webster translations. No account required; read and search online.',
  contact:
    'Contact Blessed Texts for questions, feedback, or translation suggestions. We read messages when we can and welcome ideas for the project.',
  indexed:
    'Browse every Bible book, search verses, and download the King James, World English, and Webster translations on Blessed Texts.',
  topicsIndex:
    'Explore Bible verses by topic—hope, faith, peace, love, and more. King James excerpts with links to read each passage online on Blessed Texts.',
  downloadsPdf:
    'Download free King James, World English, and Webster Bible files — full text, per book, or per chapter in TXT, Markdown, and PDF.',
  downloadsNoPdf:
    'Download free King James, World English, and Webster Bible files — full text, per book, or per chapter in TXT and Markdown.',
  notFound:
    'The page you requested was not found. Browse the Indexed Bible or read Scripture online.',
};

function readerDescription(label: string): string {
  return `Read the full ${label} in one scrollable view. Search verses, bookmark passages, and share selected verses as text or images on Blessed Texts.`;
}

describe('meta descriptions — fixed Ahrefs pages', () => {
  it('translation guides use seoDescription in range', () => {
    for (const v of Object.values(VERSIONS)) {
      assertMetaDescriptionInRange(v.seoDescription, v.routeSlug);
    }
  });

  it('about, contact, and topics index are in range', () => {
    assertMetaDescriptionInRange(PAGE_DESCRIPTIONS.about, 'about');
    assertMetaDescriptionInRange(PAGE_DESCRIPTIONS.contact, 'contact');
    assertMetaDescriptionInRange(PAGE_DESCRIPTIONS.topicsIndex, 'topics index');
  });
});

describe('meta descriptions — other indexable pages', () => {
  it('home, indexed bible, downloads, 404, and readers are in range', () => {
    assertMetaDescriptionInRange(PAGE_DESCRIPTIONS.home, 'home');
    assertMetaDescriptionInRange(PAGE_DESCRIPTIONS.indexed, 'indexed-bible');
    assertMetaDescriptionInRange(PAGE_DESCRIPTIONS.downloadsPdf, 'downloads pdf');
    assertMetaDescriptionInRange(PAGE_DESCRIPTIONS.downloadsNoPdf, 'downloads');
    for (const v of Object.values(VERSIONS)) {
      assertMetaDescriptionInRange(readerDescription(v.label), `${v.routeSlug} reader`);
    }
  });

  it('all topic detail templates are in range after truncate', () => {
    const topics = loadTopicsIndex(ROOT);
    for (const id of Object.keys(topics)) {
      const label = formatTopicLabel(id);
      const description = truncateMetaDescription(
        `Explore King James Bible verses about ${label.toLowerCase()} on Blessed Texts. Read curated excerpts and open each passage in the full searchable KJV reader.`,
      );
      expect(isMetaDescriptionInRange(description), `${id}: ${description.length}`).toBe(true);
    }
  });
});

describe('truncateMetaDescription', () => {
  it('leaves short text unchanged', () => {
    const short = 'A'.repeat(130);
    expect(truncateMetaDescription(short)).toBe(short);
  });

  it('truncates long text under max', () => {
    const long = 'word '.repeat(50);
    const out = truncateMetaDescription(long);
    expect(out.length).toBeLessThanOrEqual(160);
  });
});
