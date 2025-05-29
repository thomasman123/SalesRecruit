import OpenAI from "openai"

// Singleton OpenAI client that can be imported from anywhere on the server
// The API key is read from the OPENAI_API_KEY environment variable.
// Make sure to set this in your .env.local and **never** commit the real key.
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export default openai 