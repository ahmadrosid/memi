// Reference: https://github.com/anthropics/anthropic-cookbook/blob/main/tool_use/memory_cookbook.ipynb
type ExecuteParam = {
    action: "read" | "write" | "edit";
    content: string;
    old_string?: string;
    new_string?: string;
}

export class SimpleMemory {
    system = `
String-based memory tool for storing and modifying persistent text.

This tool maintains a single in-memory string that can be read,
replaced, or selectively edited using string replacement. It provides safety
warnings when overwriting content or when edit operations would affect
multiple occurrences.
`
    input_schema = {
        "type": "object",
        "properties": {
            "action": {
                "type": "string",
                "enum": ["read", "write", "edit"],
                "description": "The memory operation to perform: read retrieves current content, write replaces everything, edit performs string replacement",
            },
            "content": {
                "type": "string",
                "description": "Full text content to store when using write action (ignored for read/edit)",
            },
            "old_string": {
                "type": "string",
                "description": "Exact text to find and replace when using edit action (must be unique in memory)",
            },
            "new_string": {
                "type": "string",
                "description": "Replacement text to insert when using edit action",
            },
        },
        "required": ["action"],
    }

    fullMemory = ""
    compressed_memory = ""

    async execute({ action, content, old_string, new_string}: ExecuteParam) {

    }

    #readMemory() {
        return this.fullMemory
    }

    #writeMemory(content: string) {
        if (this.fullMemory) {
            let previous = this.fullMemory;
            this.fullMemory = content;
            return `"Warning: Overwriting existing content. Previous content was:\n${previous}\n\nMemory has been updated successfully."`
        }
        this.fullMemory = content;
        return "Memory updated successfully.";
    }

    #updateMemory(old_string: string, new_string: string) {
        if (!this.fullMemory.includes(old_string)) {
            return `Error: '${old_string}' not found in memory.`;
        }

        let old_memory = this.fullMemory;
        let count = old_memory.length;
        if (count > 1) {
            return `"Warning: Found ${count} occurrences of '${old_string}'. Please confirm which occurrence to replace or use more specific context.`
        }

        this.fullMemory = this.fullMemory.replace(old_string, new_string);
        return "Edited memory: 1 occurrence replaced.";
    }
}
