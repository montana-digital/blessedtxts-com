import { handleChapterRequest, apiResponse, corsPreflight } from '../../../src/lib/bible-api';
import { fetchChapterFromAssets, type PagesAssetEnv } from '../../../src/lib/bible-api-assets';

export async function onRequestGet(ctx: { request: Request; env: PagesAssetEnv }) {
  try {
    const url = new URL(ctx.request.url);
    const result = await handleChapterRequest(url, (versionId, bookSlug, chapter) =>
      fetchChapterFromAssets(ctx.request, ctx.env, versionId, bookSlug, chapter),
    );
    return apiResponse(result);
  } catch (err) {
    console.error('[api/chapter]', err);
    return apiResponse({
      status: 502,
      body: { error: 'upstream', message: 'Could not load chapter text.' },
    });
  }
}

export async function onRequestOptions() {
  return corsPreflight();
}
