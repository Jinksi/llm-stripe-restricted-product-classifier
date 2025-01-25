import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { openai } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'

const lmstudio = createOpenAICompatible({
  name: 'lmstudio',
  baseURL: 'http://localhost:1234/v1',
})

// Empty string defaults to the model selected in lmstudio
export const models = {
  localModel: lmstudio(''),
  gpt4oMini: openai('gpt-4o-mini'),
  gpt4o: openai('gpt-4o'),
  claude35Sonnet: anthropic('claude-3-5-sonnet-latest'),
  claude35Haiku: anthropic('claude-3-5-haiku-latest'),
}
