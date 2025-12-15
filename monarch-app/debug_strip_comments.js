
const stripJsonComments = (jsonStr) => {
    if (typeof jsonStr !== 'string') {
        return jsonStr;
    }
    // 1. Remove comments
    // Regex explanation:
    // Group 1: "..." string literal (handling escaped quotes)
    // Group 2: //... single line comment OR /*...*/ multi-line comment
    const withoutComments = jsonStr.replace(/("[^"\\]*(?:\\.[^"\\]*)*")|(\/\/.*|\/\*[\s\S]*?\*\/)/g, (match, str) => {
        // If 'str' is captured (it's a string literal), return it unchanged (match).
        // If 'str' is undefined (it's a comment), return empty string.
        // Special case: if 'str' is empty string "", it is falsy, but match is also "", so returns "". Correct.
        return str !== undefined ? match : "";
    });

    // 2. Remove trailing commas
    // Regex explanation:
    // Group 1: "..." string literal (preserve strings again so we don't touch commas inside)
    // OR match a comma followed by whitespace (including newlines) and then a closing brace/bracket
    return withoutComments.replace(/("[^"\\]*(?:\\.[^"\\]*)*")|,\s*(?=[\]}])/g, (match, str) => {
        return str !== undefined ? match : "";
    });
};

const runTest = (name, input, expectedSuccess = true) => {
    console.log(`--- Running Test: ${name} ---`);
    console.log(`Input length: ${input.length}`);
    try {
        const stripped = stripJsonComments(input);
        console.log(`Stripped (first 100 chars): ${stripped.substring(0, 100).replace(/\n/g, '\\n')}...`);
        JSON.parse(stripped);
        console.log("PARSE SUCCESS!");
        if (!expectedSuccess) console.error("FAILED - Expected failure but succeeded");
    } catch (e) {
        console.log("PARSE ERROR:", e.message);
        // Show context around error
        if (e.message.includes('at position')) {
            const match = e.message.match(/at position (\d+)/);
            if (match) {
                const pos = parseInt(match[1]);
                const start = Math.max(0, pos - 20);
                const end = Math.min(stripJsonComments(input).length, pos + 20);
                console.log("Context:", stripJsonComments(input).substring(start, end));
            }
        }
    }
    console.log("--------------------------------\n");
};

// 1. User's failing case (reconstructed)
const userJson = `{
    "buttons": [
		    { "label": "조회", 	"index": "List", 	"inComm": "List" },	
		    { "label": "초기화", "index": "Init", 	"inComm": "initialize" },	
		    //{ "label": "추가", 	"index": "New", 	"inComm": "New" },	
		    //{ "label": "저장", 	"index": "Save", 	"inComm": "Save" },	
		    //{ "label": "삭제", 	"index": "Del", 	"inComm": "Delete" },
	],
}`;

runTest("User Case", userJson);

// 2. Trailing comma without comments
const trailingComma = `[ 1, 2, ]`;
runTest("Simple Trailing Comma", trailingComma);

// 3. Comments inside strings (Should NOT be stripped)
const commentInString = `{ "url": "http://example.com/foo", "pattern": "/* kept */" }`;
runTest("Comments inside strings", commentInString);

// 4. Empty string keys/values
const emptyString = `{ "": "" }`;
runTest("Empty Strings", emptyString);

// 5. Multi-line comments with trailing comma
const multiLine = `{
  "key": "value" /* comment */,
}`;
runTest("Multi-line comment trailing comma", multiLine);

// 6. Nested weirdness
const nested = `[
  "string", // comment
  {
    "nested": true, // comment
  }, // trailing comma after object
]`;
runTest("Nested Structure", nested);
