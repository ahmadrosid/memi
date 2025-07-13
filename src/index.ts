import "dotenv/config";
import inquirer from "inquirer";
import autocompletePrompt from "inquirer-autocomplete-prompt";
import Anthropic from "@anthropic-ai/sdk";
import { SimpleMemory } from "./tools/simple-memory.js";

// Register the autocomplete prompt
inquirer.registerPrompt("autocomplete", autocompletePrompt);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const memory = new SimpleMemory();
let messages: Anthropic.MessageParam[] = [];

async function askAi(text: string) {
  messages.push({ role: "user", content: text });
  
  const stream = await anthropic.messages.create({
    model: "claude-4-sonnet-20250514",
    max_tokens: 1000,
    messages,
    stream: true,
    tools: [
      {
        name: "memory",
        description: memory.system,
        input_schema: memory.input_schema,
      },
    ],
  });

  // Add new line space after prompt input text
  console.log("---");

  let textResponse = "";
  let currentToolUse: any = null;
  
  for await (const event of stream) {
    if (event.type === "content_block_start") {
      if (event.content_block.type === "tool_use") {
        currentToolUse = event.content_block;
        console.log(`\n[Using memory tool: ${currentToolUse.name}]`);
      }
    } else if (event.type === "content_block_delta") {
      if (event.delta.type === "text_delta") {
        process.stdout.write(event.delta.text);
        textResponse += event.delta.text;
      } else if (event.delta.type === "input_json_delta") {
        // Accumulate tool input
        if (currentToolUse) {
          if (!currentToolUse.input_text) {
            currentToolUse.input_text = "";
          }
          currentToolUse.input_text += event.delta.partial_json;
        }
      }
    } else if (event.type === "content_block_stop") {
      if (currentToolUse && currentToolUse.type === "tool_use") {
        try {
          const input = JSON.parse(currentToolUse.input_text || "{}") as { action: "read" | "write" | "edit" | "delete"; content?: string; old_string?: string; new_string?: string };
          const toolResult = await memory.execute(input);
          console.log(`[Memory result: ${toolResult}]\n`);
          textResponse += `\n[Memory ${input.action}: ${toolResult}]`;
        } catch (error) {
          console.log(`[Memory error: ${error}]\n`);
        }
        currentToolUse = null;
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
Commands: /memory-read, /memory-write [content], /memory-edit [old] [new], /memory-delete [text]
`);

  const commands = [
    { title: "/memory-read", value: "/memory-read", description: "Read current memory contents" },
    { title: "/memory-write", value: "/memory-write ", description: "Write new content to memory" },
    { title: "/memory-edit", value: "/memory-edit ", description: "Edit existing memory content" },
    { title: "/memory-delete", value: "/memory-delete ", description: "Delete specific text from memory" },
    { title: "/help", value: "/help", description: "Show available commands" },
  ];

  while (true) {
    const response = await inquirer.prompt([
      {
        type: "autocomplete",
        name: "input",
        message: "Type here:",
        source: async (_answersSoFar: any, input: string) => {
          // If input starts with /, show commands
          if (input && input.startsWith("/")) {
            const filteredCommands = commands.filter(cmd =>
              cmd.title.toLowerCase().includes(input.toLowerCase())
            );
            return filteredCommands.map(cmd => ({
              name: `${cmd.title} - ${cmd.description}`,
              value: cmd.value
            }));
          }
          
          // For regular input, return the input itself
          if (input) {
            return [{ name: input, value: input }];
          }
          
          // Show hint when no input
          return [{ name: "Type / for commands or start chatting...", value: "" }];
        },
        suggestOnly: true,
        validate: (input: string) => {
          if (!input || input.trim() === "") {
            return "Please enter something";
          }
          return true;
        }
      }
    ]);
    if (response.input === "q" || response.input.trim() === "exit") {
      process.exit(0);
    }

    // Handle direct commands
    if (response.input.startsWith("/")) {
      const parts = response.input.split(" ");
      const command = parts[0];
      
      if (command === "/help") {
        console.log("\nAvailable commands:");
        commands.forEach(cmd => {
          console.log(`  ${cmd.title} - ${cmd.description}`);
        });
        console.log("  q or exit - Quit the session\n");
        continue;
      }
      
      if (command.startsWith("/memory-")) {
        try {
          let result;
          if (command === "/memory-read") {
            result = await memory.execute({ action: "read" });
          } else if (command === "/memory-write") {
            const content = parts.slice(1).join(" ");
            if (!content.trim()) {
              console.log("Usage: /memory-write <content>\n");
              continue;
            }
            result = await memory.execute({ action: "write", content });
          } else if (command === "/memory-edit") {
            const old_string = parts[1];
            const new_string = parts.slice(2).join(" ");
            if (!old_string || !new_string) {
              console.log("Usage: /memory-edit <old_text> <new_text>\n");
              continue;
            }
            result = await memory.execute({ action: "edit", old_string, new_string });
          } else if (command === "/memory-delete") {
            const text_to_delete = parts.slice(1).join(" ");
            if (!text_to_delete.trim()) {
              console.log("Usage: /memory-delete <text_to_delete>\n");
              continue;
            }
            result = await memory.execute({ action: "delete", old_string: text_to_delete });
          } else {
            console.log("Unknown memory command. Type /help for available commands\n");
            continue;
          }
          console.log(`Memory result: ${result}\n`);
        } catch (error) {
          console.log(`Error: ${error}\n`);
        }
        continue;
      }
      
      console.log("Unknown command. Type /help for available commands\n");
      continue;
    }

    await askAi(response.input);
  }
})();
