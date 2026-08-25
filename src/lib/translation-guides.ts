import type { VersionId } from '@/lib/bible-config';

export interface TranslationFaq {
  question: string;
  answer: string;
}

export interface TranslationGuide {
  history: string;
  license: string;
  differences: string;
  howToRead: string;
  faqs: TranslationFaq[];
}

export const TRANSLATION_GUIDES: Record<VersionId, TranslationGuide> = {
  kjv: {
    history:
      'The King James Bible was authorized in 1611 for public reading in the Church of England. Its cadence shaped English worship, literature, and memory for centuries. Blessed Texts uses a public-domain Cambridge-tradition text so you can read, search, and download it freely.',
    license:
      'This King James text is in the public domain. You may read it, quote it, and download TXT or Markdown files from Blessed Texts without an account. Please name the translation when you cite a verse.',
    differences:
      'Compared with the World English Bible, the KJV keeps older English (thee, thou, ye) and a more formal register. Compared with Webster’s 1833 revision, it is the earlier standard that Webster later simplified in places. Many readers still prefer it for memorization and liturgy.',
    howToRead:
      'Open the full searchable reader for continuous scrolling, or browse each book and chapter as a static page with verse numbers. Topic collections quote the KJV by default. Downloads are available for the whole Bible, a book, or a chapter.',
    faqs: [
      {
        question: 'Is the King James Bible public domain?',
        answer:
          'Yes. The edition offered on Blessed Texts is public-domain Scripture. You may read and download it without paying a license fee.',
      },
      {
        question: 'How do I cite a KJV verse from this site?',
        answer:
          'Name the King James Bible and link to the chapter page when you can, for example John 3 on Blessed Texts, adding the verse number in the heading or URL hash.',
      },
      {
        question: 'Does Blessed Texts change the KJV wording?',
        answer:
          'No. Chapter pages and downloads reproduce the public-domain verse text. The reader adds navigation, search, and bookmarks around that same text.',
      },
    ],
  },
  web: {
    history:
      'The World English Bible is a modern public-domain translation intended for clear reading worldwide. It updates older English while remaining freely copyable. Blessed Texts hosts it alongside the King James and Webster texts so you can compare wording without an account.',
    license:
      'The World English Bible is in the public domain. Quote it, share it, and download TXT or Markdown from this site. Cite it as the World English Bible (WEB) when you quote verses.',
    differences:
      'The WEB uses contemporary English where the KJV uses early modern forms. It is generally easier for new readers while still aiming at a literal sense. Webster’s Bible sits between them historically: nineteenth-century American English still close to the King James tradition.',
    howToRead:
      'Use the Indexed Bible to open WEB books and chapters as static pages, or launch the full WEB reader for search and bookmarks. Downloads match the same public-domain text.',
    faqs: [
      {
        question: 'Is the World English Bible free to use?',
        answer:
          'Yes. The WEB is a public-domain translation. Blessed Texts provides it for reading and download at no cost.',
      },
      {
        question: 'How is the WEB different from the KJV?',
        answer:
          'The WEB uses modern English vocabulary and sentence flow. The KJV keeps historic language that many people know by heart. Both are public domain on this site.',
      },
      {
        question: 'Can I compare WEB and KJV on Blessed Texts?',
        answer:
          'Yes. Open each translation’s reader or chapter pages in separate tabs, or use the reader’s translation controls where available.',
      },
    ],
  },
  webster: {
    history:
      'Noah Webster published his American revision of the English Bible in 1833. He aimed at plainer wording while staying close to the King James tradition. Blessed Texts offers this public-domain text for readers who want nineteenth-century American English.',
    license:
      'Webster’s 1833 Bible is in the public domain. You may read, quote, and download it from Blessed Texts. Cite it as the Webster Bible (WBT) or Noah Webster’s 1833 revision.',
    differences:
      'Webster updates some KJV words and grammar for American readers of his day without becoming a fully modern translation like the WEB. If you know the KJV well, many lines will feel familiar with occasional clearer substitutions.',
    howToRead:
      'Browse Webster books from the Indexed Bible, open a chapter page for verse-level reading, or use the full Webster reader for search and bookmarks. TXT and Markdown downloads are generated from the same text.',
    faqs: [
      {
        question: 'What is the Webster Bible on this site?',
        answer:
          'It is Noah Webster’s 1833 public-domain revision of the English Bible, offered here as the Webster Bible (WBT) for reading and download.',
      },
      {
        question: 'Is Webster’s Bible the same as the KJV?',
        answer:
          'No. It follows the King James tradition closely but revises wording for clearer American English of 1833. Compare chapter pages if you want to see the differences.',
      },
      {
        question: 'May I download the Webster Bible?',
        answer:
          'Yes. Full, per-book, and per-chapter TXT and Markdown files are on the downloads page, generated from the public-domain text.',
      },
    ],
  },
};
