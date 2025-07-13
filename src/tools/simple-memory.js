"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _SimpleMemory_instances, _SimpleMemory_readMemory, _SimpleMemory_writeMemory, _SimpleMemory_updateMemory, _SimpleMemory_deleteMemory, _SimpleMemory_loadFromFile, _SimpleMemory_saveToFile;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleMemory = void 0;
// Reference: https://github.com/anthropics/anthropic-cookbook/blob/main/tool_use/memory_cookbook.ipynb
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class SimpleMemory {
    constructor(memoryDir = ".memi") {
        _SimpleMemory_instances.add(this);
        this.system = `
String-based memory tool for storing and modifying persistent text.

This tool maintains a single persistent string that can be read, written, edited, or have content deleted.
Available actions:
- read: Retrieve current memory contents
- write: Replace entire memory with new content (use sparingly)
- edit: Replace specific text with new text 
- delete: Remove specific text from memory (use this to remove/delete content)

It provides safety warnings when overwriting content or when operations would affect multiple occurrences.
`;
        this.input_schema = {
            type: "object",
            properties: {
                action: {
                    type: "string",
                    enum: ["read", "write", "edit", "delete"],
                    description: "The memory operation to perform: 'read' retrieves current content, 'write' replaces everything (use sparingly), 'edit' performs string replacement, 'delete' removes/deletes specific text from memory",
                },
                content: {
                    type: "string",
                    description: "Full text content to store when using write action (ignored for read/edit/delete)",
                },
                old_string: {
                    type: "string",
                    description: "For edit action: exact text to find and replace. For delete action: exact text to remove from memory. Must be unique in memory.",
                },
                new_string: {
                    type: "string",
                    description: "Replacement text to insert when using edit action (not used for delete action)",
                },
            },
            required: ["action"],
        };
        this.fullMemory = "";
        this.compressed_memory = "";
        // Create memory directory if it doesn't exist
        if (!fs.existsSync(memoryDir)) {
            fs.mkdirSync(memoryDir, { recursive: true });
        }
        this.memoryFilePath = path.join(memoryDir, "memory.txt");
        __classPrivateFieldGet(this, _SimpleMemory_instances, "m", _SimpleMemory_loadFromFile).call(this);
    }
    execute(_a) {
        return __awaiter(this, arguments, void 0, function* ({ action, content, old_string, new_string }) {
            switch (action) {
                case "read":
                    return __classPrivateFieldGet(this, _SimpleMemory_instances, "m", _SimpleMemory_readMemory).call(this);
                case "write":
                    // Allow empty content to clear memory completely
                    const writeContent = content || "";
                    return __classPrivateFieldGet(this, _SimpleMemory_instances, "m", _SimpleMemory_writeMemory).call(this, writeContent);
                case "edit":
                    if (!old_string || !new_string) {
                        return "Error: 'old_string' and 'new_string' are required for edit action.";
                    }
                    return __classPrivateFieldGet(this, _SimpleMemory_instances, "m", _SimpleMemory_updateMemory).call(this, old_string, new_string);
                case "delete":
                    if (!old_string) {
                        return "Error: 'old_string' is required for delete action.";
                    }
                    return __classPrivateFieldGet(this, _SimpleMemory_instances, "m", _SimpleMemory_deleteMemory).call(this, old_string);
                default:
                    return `Error: Unknown action '${action}'. Valid actions are: read, write, edit, delete.`;
            }
        });
    }
}
exports.SimpleMemory = SimpleMemory;
_SimpleMemory_instances = new WeakSet(), _SimpleMemory_readMemory = function _SimpleMemory_readMemory() {
    return this.fullMemory;
}, _SimpleMemory_writeMemory = function _SimpleMemory_writeMemory(content) {
    if (this.fullMemory && content === "") {
        let previous = this.fullMemory;
        this.fullMemory = content;
        __classPrivateFieldGet(this, _SimpleMemory_instances, "m", _SimpleMemory_saveToFile).call(this);
        return `Memory cleared successfully. Previous content was:\n${previous}`;
    }
    else if (this.fullMemory) {
        let previous = this.fullMemory;
        this.fullMemory = content;
        __classPrivateFieldGet(this, _SimpleMemory_instances, "m", _SimpleMemory_saveToFile).call(this);
        return `Warning: Overwriting existing content. Previous content was:\n${previous}\n\nMemory has been updated successfully.`;
    }
    this.fullMemory = content;
    __classPrivateFieldGet(this, _SimpleMemory_instances, "m", _SimpleMemory_saveToFile).call(this);
    return "Memory updated successfully.";
}, _SimpleMemory_updateMemory = function _SimpleMemory_updateMemory(old_string, new_string) {
    if (!this.fullMemory.includes(old_string)) {
        return `Error: '${old_string}' not found in memory.`;
    }
    const count = this.fullMemory.split(old_string).length - 1;
    if (count > 1) {
        return `Warning: Found ${count} occurrences of '${old_string}'. Please confirm which occurrence to replace or use more specific context.`;
    }
    this.fullMemory = this.fullMemory.replace(old_string, new_string);
    __classPrivateFieldGet(this, _SimpleMemory_instances, "m", _SimpleMemory_saveToFile).call(this);
    return "Edited memory: 1 occurrence replaced.";
}, _SimpleMemory_deleteMemory = function _SimpleMemory_deleteMemory(old_string) {
    if (!this.fullMemory.includes(old_string)) {
        return `Error: '${old_string}' not found in memory.`;
    }
    const count = this.fullMemory.split(old_string).length - 1;
    if (count > 1) {
        return `Warning: Found ${count} occurrences of '${old_string}'. Please confirm which occurrence to delete or use more specific context.`;
    }
    this.fullMemory = this.fullMemory.replace(old_string, "");
    __classPrivateFieldGet(this, _SimpleMemory_instances, "m", _SimpleMemory_saveToFile).call(this);
    return "Deleted from memory: 1 occurrence removed.";
}, _SimpleMemory_loadFromFile = function _SimpleMemory_loadFromFile() {
    try {
        if (fs.existsSync(this.memoryFilePath)) {
            this.fullMemory = fs.readFileSync(this.memoryFilePath, "utf-8");
        }
    }
    catch (error) {
        console.warn(`Warning: Could not load memory from ${this.memoryFilePath}:`, error);
    }
}, _SimpleMemory_saveToFile = function _SimpleMemory_saveToFile() {
    try {
        fs.writeFileSync(this.memoryFilePath, this.fullMemory, "utf-8");
    }
    catch (error) {
        console.warn(`Warning: Could not save memory to ${this.memoryFilePath}:`, error);
    }
};
