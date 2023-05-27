import * as pkg from '../../../pkg/entities'
import { ListEntityExtraction, ListEntityDef, ListEntityValue, ListEntitySynonym } from '../typings'
import { Heap, WasmVec } from './memory'

/**
 * IMPORTANT:
 *
 * - The keyword `new` should *never* be used in this file.
 * - Instead, use `heap.allocate` to create wasm structs.
 */

type FromJs = ReturnType<typeof FromJs>
const FromJs = (heap: Heap) => {
  const mapEntitySynonym = (synonym: ListEntitySynonym): pkg.SynonymDefinition => {
    const wasmTokens = WasmVec.of(heap, pkg.StringArray).fill(synonym.tokens)
    return heap.allocate(pkg.SynonymDefinition, wasmTokens.x)
  }
  const mapEntityValue = (value: ListEntityValue): pkg.ValueDefinition => {
    const wasmSynonyms = WasmVec.of(heap, pkg.SynonymArray).fill(value.synonyms.map(mapEntitySynonym.bind(this)))
    return heap.allocate(pkg.ValueDefinition, value.name, wasmSynonyms.x)
  }
  const mapEntityDef = (listModel: ListEntityDef): pkg.EntityDefinition => {
    const wasmValues = WasmVec.of(heap, pkg.ValueArray).fill(listModel.values.map(mapEntityValue.bind(this)))
    return heap.allocate(pkg.EntityDefinition, listModel.name, listModel.fuzzy, wasmValues.x)
  }
  return {
    mapEntitySynonym,
    mapEntityValue,
    mapEntityDef
  }
}

type FromRust = ReturnType<typeof FromRust>
const FromRust = () => {
  const mapEntityExtraction = (wasmExtraction: pkg.EntityExtraction): ListEntityExtraction => {
    const extraction = {
      name: wasmExtraction.name,
      confidence: wasmExtraction.confidence,
      value: wasmExtraction.value,
      source: wasmExtraction.source,
      char_start: wasmExtraction.char_start,
      char_end: wasmExtraction.char_end
    }

    // IMPORTANT: free the extraction to avoid memory leaks
    wasmExtraction.free()

    return extraction
  }

  const mapEntityExtractions = (listExtractions: pkg.ExtractionArray): ListEntityExtraction[] => {
    const extractions: ListEntityExtraction[] = []
    for (let i = 0; i < listExtractions.len(); i++) {
      const extraction = listExtractions.get(i)
      extractions.push(mapEntityExtraction(extraction))
    }

    // IMPORTANT: free the extraction to avoid memory leaks
    listExtractions.free()

    return extractions
  }

  return {
    mapEntityExtraction,
    mapEntityExtractions
  }
}

export const extractForListModels = (strTokens: string[], listDefinitions: ListEntityDef[]): ListEntityExtraction[] => {
  const heap = Heap.create()

  const fromJs = FromJs(heap)
  const fromRust = FromRust()

  const wasmStrTokens = WasmVec.of(heap, pkg.StringArray).fill(strTokens)
  const wasmListDefinitions = WasmVec.of(heap, pkg.EntityArray).fill(listDefinitions.map(fromJs.mapEntityDef))
  const wasmListExtractions = pkg.extract_multiple(wasmStrTokens.x, wasmListDefinitions.x)

  // IMPORTANT: free the heap to avoid memory leaks
  heap.free()

  const listExtractions = fromRust.mapEntityExtractions(wasmListExtractions)
  return listExtractions
}
