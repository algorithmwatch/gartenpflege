import cheerio from 'cheerio';
import {
  JsonLinkedData,
  ParserFieldParams,
  ParserResult,
  ParserResultSlug,
} from './types';
import { extractJsonLinkedData } from './utils';

class HarkeParsingError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'HarkeParsingError';

    // In Typescript we need to set the prototype explicitly (https://stackoverflow.com/a/41429145/5732518)
    Object.setPrototypeOf(this, HarkeParsingError.prototype);
  }
}

function parse(
  slug: ParserResultSlug,
  html: string,
  schema: any,
): ParserResult {
  const $html: cheerio.Root = cheerio.load(html);
  const linkedData: JsonLinkedData = extractJsonLinkedData($html);
  const parsedFields: { [key: string]: any } = {};
  const errors = [];

  const fieldKeys = Object.keys(schema);

  for (const fieldKey of fieldKeys) {
    try {
      const params: ParserFieldParams = {
        $: $html,
        linkedData: linkedData,
      };
      parsedFields[fieldKey] = schema[fieldKey](params);
    } catch (error) {
      if (error instanceof HarkeParsingError) {
        // silently record parsing errors
        errors.push({
          field: fieldKey,
          message: error.message,
        });
      } else {
        // unknown error, rethrow it
        throw error;
      }
    }
  }

  return {
    slug,
    fields: parsedFields,
    errors,
  };
}

export { parse, HarkeParsingError };