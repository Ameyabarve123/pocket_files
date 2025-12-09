import { GoogleGenAI } from "@google/genai";

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({});

async function main() {
  // const response = await ai.models.generateContent({
  //   model: "gemini-2.5-flash",
  //   contents: "Explain how AI works in a few words",
  // });
  // console.log(response.text);

  const ai = new GoogleGenAI({});

  const response = await ai.models.embedContent({
      model: 'gemini-embedding-001',
      contents: 'What is the meaning of life?',
  });

  console.log(response.embeddings);
}

export default function TestFiles() {
  main();
  return (
    <div>Yo</div>
  )
}
