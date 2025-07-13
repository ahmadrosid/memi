// Reference: https://github.com/anthropics/anthropic-cookbook/blob/main/tool_use/memory_cookbook.ipynb
import * as fs from "fs";
import * as path from "path";

type ExecuteParam = {
    action: "read" | "write" | "edit" | "delete";
    content?: string;
    old_string?: string;
    new_string?: string;
}

export class SimpleMemory {
    private memoryFilePath: string;
    
    system = `
String-based memory tool for storing and modifying persistent text.

This tool maintains a single persistent string that can be read, written, edited, or have content deleted.
Available actions:
- read: Retrieve current memory contents
- write: Replace entire memory with new content (use sparingly)
- edit: Replace specific text with new text 
- delete: Remove specific text from memory (use this to remove/delete content)

It provides safety warnings when overwriting content or when operations would affect multiple occurrences.
`
    input_schema = {
        type: "object" as const,
        properties: {
            action: {
                type: "string" as const,
                enum: ["read", "write", "edit", "delete"] as const,
                description: "The memory operation to perform: 'read' retrieves current content, 'write' replaces everything (use sparingly), 'edit' performs string replacement, 'delete' removes/deletes specific text from memory",
            },
            content: {
                type: "string" as const,
                description: "Full text content to store when using write action (ignored for read/edit/delete)",
            },
            old_string: {
                type: "string" as const,
                description: "For edit action: exact text to find and replace. For delete action: exact text to remove from memory. Must be unique in memory.",
            },
            new_string: {
                type: "string" as const,
                description: "Replacement text to insert when using edit action (not used for delete action)",
            },
        },
        required: ["action"] as const,
    }

    fullMemory = ""
    compressed_memory = ""

    constructor(memoryDir: string = ".memi") {
        // Create memory directory if it doesn't exist
        if (!fs.existsSync(memoryDir)) {
            fs.mkdirSync(memoryDir, { recursive: true });
        }
        
        this.memoryFilePath = path.join(memoryDir, "memory.txt");
        this.#loadFromFile();
    }

    async execute({ action, content, old_string, new_string}: ExecuteParam) {
        switch (action) {
            case "read":
                return this.#readMemory();
            case "write":
                // Allow empty content to clear memory completely
                const writeContent = content || "";
                return this.#writeMemory(writeContent);
            case "edit":
                if (!old_string || !new_string) {
                    return "Error: 'old_string' and 'new_string' are required for edit action.";
                }
                return this.#updateMemory(old_string, new_string);
            case "delete":
                if (!old_string) {
                    return "Error: 'old_string' is required for delete action.";
                }
                return this.#deleteMemory(old_string);
            default:
                return `Error: Unknown action '${action}'. Valid actions are: read, write, edit, delete.`;
        }
    }

    #readMemory() {
        return this.fullMemory
    }

    #writeMemory(content: string) {
        if (this.fullMemory && content === "") {
            let previous = this.fullMemory;
            this.fullMemory = content;
            this.#saveToFile();
            return `Memory cleared successfully. Previous content was:\n${previous}`;
        } else if (this.fullMemory) {
            let previous = this.fullMemory;
            this.fullMemory = content;
            this.#saveToFile();
            return `Warning: Overwriting existing content. Previous content was:\n${previous}\n\nMemory has been updated successfully.`
        }
        this.fullMemory = content;
        this.#saveToFile();
        return "Memory updated successfully.";
    }

    #updateMemory(old_string: string, new_string: string) {
        if (!this.fullMemory.includes(old_string)) {
            return `Error: '${old_string}' not found in memory.`;
        }

        const count = this.fullMemory.split(old_string).length - 1;
        if (count > 1) {
            return `Warning: Found ${count} occurrences of '${old_string}'. Please confirm which occurrence to replace or use more specific context.`;
        }

        this.fullMemory = this.fullMemory.replace(old_string, new_string);
        this.#saveToFile();
        return "Edited memory: 1 occurrence replaced.";
    }

    #deleteMemory(old_string: string) {
        if (!this.fullMemory.includes(old_string)) {
            return `Error: '${old_string}' not found in memory.`;
        }

        const count = this.fullMemory.split(old_string).length - 1;
        if (count > 1) {
            return `Warning: Found ${count} occurrences of '${old_string}'. Please confirm which occurrence to delete or use more specific context.`;
        }

        this.fullMemory = this.fullMemory.replace(old_string, "");
        this.#saveToFile();
        return "Deleted from memory: 1 occurrence removed.";
    }

    #loadFromFile() {
        try {
            if (fs.existsSync(this.memoryFilePath)) {
                this.fullMemory = fs.readFileSync(this.memoryFilePath, "utf-8");
            }
        } catch (error) {
            console.warn(`Warning: Could not load memory from ${this.memoryFilePath}:`, error);
        }
    }

    #saveToFile() {
        try {
            fs.writeFileSync(this.memoryFilePath, this.fullMemory, "utf-8");
        } catch (error) {
            console.warn(`Warning: Could not save memory to ${this.memoryFilePath}:`, error);
        }
    }
}
