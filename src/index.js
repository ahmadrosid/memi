"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const inquirer_1 = __importDefault(require("inquirer"));
const inquirer_autocomplete_prompt_1 = __importDefault(require("inquirer-autocomplete-prompt"));
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const simple_memory_js_1 = require("./tools/simple-memory.js");
// Register the autocomplete prompt
inquirer_1.default.registerPrompt("autocomplete", inquirer_autocomplete_prompt_1.default);
const anthropic = new sdk_1.default({
    apiKey: process.env.ANTHROPIC_API_KEY,
});
const memory = new simple_memory_js_1.SimpleMemory();
let messages = [];
function askAi(text) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, e_1, _b, _c;
        messages.push({ role: "user", content: text });
        const stream = yield anthropic.messages.create({
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
        let currentToolUse = null;
        try {
            for (var _d = true, stream_1 = __asyncValues(stream), stream_1_1; stream_1_1 = yield stream_1.next(), _a = stream_1_1.done, !_a; _d = true) {
                _c = stream_1_1.value;
                _d = false;
                const event = _c;
                if (event.type === "content_block_start") {
                    if (event.content_block.type === "tool_use") {
                        currentToolUse = event.content_block;
                        console.log(`\n[Using memory tool: ${currentToolUse.name}]`);
                    }
                }
                else if (event.type === "content_block_delta") {
                    if (event.delta.type === "text_delta") {
                        process.stdout.write(event.delta.text);
                        textResponse += event.delta.text;
                    }
                    else if (event.delta.type === "input_json_delta") {
                        // Accumulate tool input
                        if (currentToolUse) {
                            if (!currentToolUse.input_text) {
                                currentToolUse.input_text = "";
                            }
                            currentToolUse.input_text += event.delta.partial_json;
                        }
                    }
                }
                else if (event.type === "content_block_stop") {
                    if (currentToolUse && currentToolUse.type === "tool_use") {
                        try {
                            const input = JSON.parse(currentToolUse.input_text || "{}");
                            const toolResult = yield memory.execute(input);
                            console.log(`[Memory result: ${toolResult}]\n`);
                            textResponse += `\n[Memory ${input.action}: ${toolResult}]`;
                        }
                        catch (error) {
                            console.log(`[Memory error: ${error}]\n`);
                        }
                        currentToolUse = null;
                    }
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = stream_1.return)) yield _b.call(stream_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        if (textResponse !== "") {
            messages.push({
                role: "assistant",
                content: textResponse,
            });
        }
        // Add new line space after ai response text
        console.log("\n");
    });
}
(() => __awaiter(void 0, void 0, void 0, function* () {
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
        const response = yield inquirer_1.default.prompt([
            {
                type: "autocomplete",
                name: "input",
                message: "Type here:",
                source: (_answersSoFar, input) => __awaiter(void 0, void 0, void 0, function* () {
                    // If input starts with /, show commands
                    if (input && input.startsWith("/")) {
                        const filteredCommands = commands.filter(cmd => cmd.title.toLowerCase().includes(input.toLowerCase()));
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
                }),
                suggestOnly: true,
                validate: (input) => {
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
                        result = yield memory.execute({ action: "read" });
                    }
                    else if (command === "/memory-write") {
                        const content = parts.slice(1).join(" ");
                        if (!content.trim()) {
                            console.log("Usage: /memory-write <content>\n");
                            continue;
                        }
                        result = yield memory.execute({ action: "write", content });
                    }
                    else if (command === "/memory-edit") {
                        const old_string = parts[1];
                        const new_string = parts.slice(2).join(" ");
                        if (!old_string || !new_string) {
                            console.log("Usage: /memory-edit <old_text> <new_text>\n");
                            continue;
                        }
                        result = yield memory.execute({ action: "edit", old_string, new_string });
                    }
                    else if (command === "/memory-delete") {
                        const text_to_delete = parts.slice(1).join(" ");
                        if (!text_to_delete.trim()) {
                            console.log("Usage: /memory-delete <text_to_delete>\n");
                            continue;
                        }
                        result = yield memory.execute({ action: "delete", old_string: text_to_delete });
                    }
                    else {
                        console.log("Unknown memory command. Type /help for available commands\n");
                        continue;
                    }
                    console.log(`Memory result: ${result}\n`);
                }
                catch (error) {
                    console.log(`Error: ${error}\n`);
                }
                continue;
            }
            console.log("Unknown command. Type /help for available commands\n");
            continue;
        }
        yield askAi(response.input);
    }
}))();
