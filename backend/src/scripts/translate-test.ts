/**
 * Smoke-test the Gemini translation service from the terminal.
 * Run: npm run translate:test
 * Prints the translated output, or the FULL upstream error (status + Google's body).
 */
import { config } from '../config';
import { translatePropertyContent } from '../modules/translation/translation.service';
import { AppError } from '../lib/errors';

async function main() {
  // eslint-disable-next-line no-console
  console.log('Auth mode:', {
    serviceAccount: Boolean(config.GOOGLE_APPLICATION_CREDENTIALS),
    useVertex: config.GEMINI_USE_VERTEX,
    apiKey: Boolean(config.GEMINI_API_KEY),
    model: config.GEMINI_MODEL,
    location: config.GCP_LOCATION,
  });

  try {
    const out = await translatePropertyContent({
      title: 'Apartament luksoz me tre dhoma në qendër të Prishtinës',
      description: 'Banesë e re me parking, ashensor dhe pamje nga qyteti. Afër shkollave dhe qendrave tregtare.',
    });
    // eslint-disable-next-line no-console
    console.log('\n✅ Translation OK:\n', JSON.stringify(out, null, 2));
  } catch (err) {
    if (err instanceof AppError) {
      // eslint-disable-next-line no-console
      console.error(`\n❌ ${err.statusCode} ${err.code}: ${err.message}`);
      // eslint-disable-next-line no-console
      console.error('Upstream detail:', err.details ?? '(none)');
    } else {
      // eslint-disable-next-line no-console
      console.error('\n❌ Unexpected error:', err);
    }
    process.exit(1);
  }
}

void main();
