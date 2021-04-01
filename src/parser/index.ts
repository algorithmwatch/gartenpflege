import * as cheerio from 'cheerio'
import {
  JsonLinkedData,
  ParserFieldParams,
  ParserFieldsSchema,
  ParserFieldsSchemaVideoPage,
  ParserFieldsSchemaPaylist,
  ParserResult
} from '../types'
import { extractJsonLinkedData } from './utils'


export class HarkeParsingError extends Error {
	constructor(message?: string) {
		super(message)
		this.name = 'HarkeParsingError'

    // In Typescript we need to set the prototype explicitly (https://stackoverflow.com/a/41429145/5732518)
    Object.setPrototypeOf(this, HarkeParsingError.prototype);
	}
}

export default class Parser {
  slug: string
  $html: cheerio.Root
  linkedData: JsonLinkedData
  parsedFields: { [key: string]: any }
  fieldsWithoutResult: string[]

  constructor(
    slug: 'video-page' | 'playlist-page',
    html: string,
    schema: ParserFieldsSchema
  ) {
    this.slug = slug
    this.$html = cheerio.load(html)
    this.linkedData = extractJsonLinkedData(this.$html)
    this.parsedFields = {}
    this.fieldsWithoutResult = []

    this.parse(schema)
  }

  parse (schema: ParserFieldsSchema) {
    const fieldKeys = Object.keys(schema)

    if (!fieldKeys.length) return

    for (let i = 0, l = fieldKeys.length; i < l; i++) {
      const fieldKey = fieldKeys[i] as keyof ParserFieldsSchema

      try {
        const params: ParserFieldParams = {
          $: this.$html,
          linkedData: this.linkedData
        }
        this.parsedFields[fieldKey] = schema[fieldKey](params)
      } catch (error) {
        if (error instanceof HarkeParsingError) {
          // silently record parsing errors
          this.fieldsWithoutResult.push(fieldKey)
        } else {
          // unknown error, rethrow it
          throw error;
        }
      }
    }
  }

  get result (): ParserResult {
    return {
      slug: this.slug,
      fields: this.parsedFields,
      errors: this.fieldsWithoutResult
    }
  }

}