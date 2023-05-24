import { ListEntityExtraction, ListEntityModel, wasm, node } from './list-engine'
import { spaceTokenizer } from './space-tokenizer'

type Logger = {
  debug: (...x: string[]) => void
  info: (...x: string[]) => void
  warn: (...x: string[]) => void
  error: (...x: string[]) => void
}

let DEBUG: boolean = false
let ITERATIONS: number = 1000
let ENGINE: 'node' | 'wasm' = 'wasm'

const logger: Logger = {
  debug: (...x) => DEBUG && console.log(...x),
  info: (...x) => console.log(...x),
  warn: (...x) => console.log(...x),
  error: (...x) => console.log(...x)
}

const FuzzyTolerance = {
  Loose: 0.65,
  Medium: 0.8,
  Strict: 1
} as const

const chalk = {
  red: (x: string) => `\x1b[31m${x}\x1b[0m`,
  green: (x: string) => `\x1b[32m${x}\x1b[0m`,
  blue: (x: string) => `\x1b[34m${x}\x1b[0m`,
  yellow: (x: string) => `\x1b[33m${x}\x1b[0m`,
  magenta: (x: string) => `\x1b[35m${x}\x1b[0m`,
  cyan: (x: string) => `\x1b[36m${x}\x1b[0m`,
  redBright: (x: string) => `\x1b[91m${x}\x1b[0m`,
  greenBright: (x: string) => `\x1b[92m${x}\x1b[0m`,
  blueBright: (x: string) => `\x1b[94m${x}\x1b[0m`,
  yellowBright: (x: string) => `\x1b[93m${x}\x1b[0m`,
  magentaBright: (x: string) => `\x1b[95m${x}\x1b[0m`,
  cyanBright: (x: string) => `\x1b[96m${x}\x1b[0m`
}

const T = spaceTokenizer

const list_entities = [
  {
    name: 'fruit',
    fuzzy: FuzzyTolerance.Medium,
    tokens: {
      Blueberry: ['blueberries', 'blueberry', 'blue berries', 'blue berry', 'poisonous blueberry'].map(T),
      Strawberry: ['strawberries', 'strawberry', 'straw berries', 'straw berry'].map(T),
      Raspberry: ['raspberries', 'raspberry', 'rasp berries', 'rasp berry'].map(T),
      Apple: ['apple', 'apples', 'red apple', 'yellow apple'].map(T)
    }
  },
  {
    name: 'company',
    fuzzy: FuzzyTolerance.Medium,
    tokens: {
      Apple: ['Apple', 'Apple Computers', 'Apple Corporation', 'Apple Inc'].map(T)
    }
  },
  {
    name: 'airport',
    fuzzy: FuzzyTolerance.Medium,
    tokens: {
      JFK: ['JFK', 'New-York', 'NYC'].map(T),
      SFO: ['SFO', 'SF', 'San-Francisco'].map(T),
      YQB: ['YQB', 'Quebec', 'Quebec city', 'QUEB'].map(T)
    }
  },
  {
    name: 'state',
    fuzzy: FuzzyTolerance.Medium,
    tokens: {
      NewYork: ['New York'].map(T)
    }
  },
  {
    name: 'city',
    fuzzy: FuzzyTolerance.Medium,

    tokens: {
      NewYork: ['New York', 'Big Apple'].map(T)
    }
  }
] as const satisfies readonly ListEntityModel[]

const runExtraction = (utt: string, models: ListEntityModel | readonly ListEntityModel[]): void => {
  logger.debug(chalk.blueBright(`\n\n${utt}`))

  models = Array.isArray(models) ? models : [models]

  const tokens = spaceTokenizer(utt)
  const output: ListEntityExtraction[] = []
  for (const model of models) {
    if (ENGINE === 'node') {
      output.push(...node.extractForListModel(tokens, model))
    } else {
      output.push(...wasm.extractForListModel(tokens, model))
    }
  }

  if (!DEBUG) {
    return
  }

  for (const { char_start, char_end, source, confidence } of output) {
    const mapChars = (x: string, c: string) =>
      x
        .split('')
        .map(() => c)
        .join('')

    const before = mapChars(utt.slice(0, char_start), '-')
    const extracted = mapChars(utt.slice(char_start, char_end), '^')
    const after = mapChars(utt.slice(char_end), '-')
    logger.debug(`${before}${chalk.green(extracted)}${after}`, `(${confidence.toFixed(2)})`)
  }
}

logger.info('Start')
const t0 = Date.now()
for (let i = 0; i < ITERATIONS; i++) {
  runExtraction('Blueberries are berries that are blue', list_entities)
  runExtraction('I want to go to New-York', list_entities)
  runExtraction('I want to eat an apple', list_entities)
  runExtraction('I want to eat an Apple in the big Apple', list_entities)
}
const t1 = Date.now()
logger.info(`Time: ${t1 - t0}ms`)
