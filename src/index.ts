import prompts from "prompts";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

let messages: Anthropic.MessageParam[] = [];

async function askAi(text: string) {
  messages.push({ role: "user", content: text });
  const stream = await anthropic.messages.create({
    model: "claude-4-sonnet-20250514",
    max_tokens: 1000,
    messages,
    stream: true,
  });

  // Add new line space after prompt input text
  console.log("---");

  let textResponse = "";
  for await (const event of stream) {
    if (event.type == "content_block_delta") {
      if (event.delta.type === "text_delta") {
        process.stdout.write(event.delta.text);
        textResponse += event.delta.text;
      }
    }
  }

  if (textResponse !== "") {
    messages.push({
      role: "assistant",
      content: textResponse,
    });
  }

  // Add new line space after ai response text
  console.log("\n");
}

(async () => {
  console.log(`
Welcome to memi, you personal knowledge AI assistant.
Start chatting with ai or 'q' to quite session.
`);

  while (true) {
    const response = await prompts([
      {
        type: "text",
        name: "input",
        message: "Type here",
      },
    ]);
    if (response.input === "q" || response.input.trim() === "exit") {
      process.exit(0);
    }

    await askAi(response.input);
  }
})();
