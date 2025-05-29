import OpenAI from "openai"

let openaiSingleton: OpenAI | null = null

export function getOpenAI() {
  if (!openaiSingleton) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not set in the environment")
    }
    openaiSingleton = new OpenAI({ apiKey })
  }
  return openaiSingleton
}

export default getOpenAI 