import { isBrowser, isNode } from 'browser-or-node'
import type * as pkg from '../../../../pkg.node'
import { ListEntityExtraction, ListEntityModel } from '../typings'
import { WasmVec } from './wasm-vec'

const resolveEngine = async (): Promise<typeof pkg> => {
  if (isBrowser && !isNode) {
    const module = require('../../../../pkg.web')
    await module.default()
    return module
  }
  return require('../../../../pkg.node')
}
let engine: typeof pkg

/**
 * IMPORTANT:
 *
 *   Inputs of wasm functions don't have to be freed. Worse: if they are freed, the program will crash.
 *   It seems that, someone in the process is responsible for freeing them, but I don't know who.
 *   It is not really clear in the wasm-bindgen documentation, and the generated code is not easy to read.
 *
 *   However, outputs of wasm functions must be freed, otherwise there will be memory leaks.
 */

type Model = ListEntityModel
type Value = Model['values'][number]
type Synonym = Value['synonyms'][number]

namespace fromJs {
  export const mapEntitySynonym = (synonym: Synonym): pkg.SynonymDefinition => {
    const wasmTokens = new WasmVec(engine.StringArray).fill(synonym.tokens)
    return new engine.SynonymDefinition(wasmTokens.x)
  }
  export const mapEntityValue = (value: Value): pkg.ValueDefinition => {
    const wasmSynonyms = new WasmVec(engine.SynonymArray).fill(value.synonyms.map(mapEntitySynonym))
    return new engine.ValueDefinition(value.name, wasmSynonyms.x)
  }
  export const mapEntityModel = (listModel: ListEntityModel): pkg.EntityDefinition => {
    const wasmValues = new WasmVec(engine.ValueArray).fill(listModel.values.map(mapEntityValue))
    return new engine.EntityDefinition(listModel.name, listModel.fuzzy, wasmValues.x)
  }
}

namespace fromRust {
  export const mapEntityExtraction = (wasmExtraction: pkg.EntityExtraction): ListEntityExtraction => {
    const extraction = {
      name: wasmExtraction.name,
      confidence: wasmExtraction.confidence,
      value: wasmExtraction.value,
      source: wasmExtraction.source,
      charStart: wasmExtraction.char_start,
      charEnd: wasmExtraction.char_end
    }

    // IMPORTANT: free the extraction to avoid memory leaks
    wasmExtraction.free()

    return extraction
  }

  export const mapEntityExtractions = (listExtractions: pkg.ExtractionArray): ListEntityExtraction[] => {
    const extractions: ListEntityExtraction[] = []
    for (let i = 0; i < listExtractions.len(); i++) {
      const extraction = listExtractions.get(i)
      extractions.push(mapEntityExtraction(extraction))
    }

    // IMPORTANT: free the extraction to avoid memory leaks
    listExtractions.free()

    return extractions
  }
}

export const extractForListModels = async (
  strTokens: string[],
  listDefinitions: ListEntityModel[]
): Promise<ListEntityExtraction[]> => {
  if (!engine) {
    engine = await resolveEngine()
  }
  const wasmStrTokens = new WasmVec(engine.StringArray).fill(strTokens)
  const wasmListDefinitions = new WasmVec(engine.EntityArray).fill(listDefinitions.map(fromJs.mapEntityModel))
  const wasmListExtractions = engine.extract_multiple(wasmStrTokens.x, wasmListDefinitions.x)
  const listExtractions = fromRust.mapEntityExtractions(wasmListExtractions)
  return listExtractions
}
