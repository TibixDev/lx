import axios, { AxiosError } from "axios";
import pc from "picocolors"
import ora from 'ora';
// @ts-ignore - Even with the @types/keypress package, it doesn't work
import keypress from 'keypress';
import { execSync } from "child_process";
import { getConfig, handleConfigCommand } from "./utils/confutil";

// Handle config commands
const argv = process.argv.slice(2);
if (argv[0] === 'conf') {
    handleConfigCommand(argv.slice(1));
    process.exit();
}

// System and Distro Information
const systemInfo = execSync("uname -a").toString();
const distroInfo = execSync("cat /etc/*-release | grep DISTRIB").toString();

// LLM related constants
const OLLAMA_API = getConfig().api;
const OLLAMA_MODEL = getConfig().model;
const PROMPT = argv.join(" ");
console.log('>> ' + pc.yellow(PROMPT))
const FINAL_PROMPT = `
You'll be playing the role of an assistant to a software engineer. Your job is to help them with their tasks.

You should **only** respond with commands that the engineer can run in their terminal.
You can respond with multiple solutions too, up to a maximum of 5, but each line should be a solution of its own.
Try to only rely on packages likely included in a standard Linux distribution.
Keep your solution concise and to the point.

Your response format should be a markdown code block, like so:
\`\`\`bash
command1
command2
command3
\`\`\`

Do **not** provide an explanation or context under any circumstances! Do **not** say anything other than the commands.

Distro Information:
\`\`\`
${distroInfo}
\`\`\`

System Information:
\`\`\`
${systemInfo}
\`\`\`

Task:
"${PROMPT}"
`

// Check for the Ollama server status
try {
    await axios.get(`${OLLAMA_API}`);
} catch (e: any) {
    if (e.status !== 200) {
        console.error(`Ollama server request failed. Please ensure Ollama is installed and running at '${OLLAMA_API}'`);
        process.exit();
    }
}

// Check if model is installed
const modelsRes = await axios.get(`${OLLAMA_API}/api/tags`);
const models = modelsRes.data.models;
if (!models) {
    console.error(`No models found. Please ensure at least one model is installed.`);
    process.exit();
}

if (!models.some((m: any) => m.model === OLLAMA_MODEL)) {
    console.error(`Model '${OLLAMA_MODEL}' not found. Please ensure the model is installed.`);
    console.error(`Available models: '${models.map((m: any) => m.model).join(', ')}'`);

    process.exit();
}


const spinner = ora('Contacting the force...').start();

const res = await axios.post(`${OLLAMA_API}/api/generate`, {
    model: OLLAMA_MODEL,
    prompt: FINAL_PROMPT,
    stream: false,
}, {
    headers: {
        "Content-Type": "application/json"
    }
});

spinner.stop();

const stdin = process.openStdin();

// Key press setup
keypress(stdin);
process.stdin.setRawMode(true);
process.stdin.resume();

// Parse the response commands
let commands: string[] = res.data.response.split('\n');
const startIdx = commands.findIndex((cmd) => cmd.startsWith('```'));
const endIdx = commands.findIndex((cmd, idx) => idx > startIdx && cmd.startsWith('```'));
commands = commands.slice(startIdx + 1, endIdx).filter((cmd) => cmd.trim().length > 0);

let cmdIdx = 0;
process.stdout.write(`<< [${cmdIdx+1}/${commands.length}] << ` + pc.gray(commands[cmdIdx]));
stdin.addListener("keypress", function(ch, key) {
    // Handle CTRL + C exit
    if (key && key.ctrl && key.name === "c") {
        process.exit();
    }

    // Handle arrow keys
    if (key && key.name === "left" && cmdIdx > 0) {
        cmdIdx--;
    } else if (key && key.name === "right") {
        if (cmdIdx >= commands.length - 1) return;
        cmdIdx++;
    }

    // Handle enter
    if (key && key.name === "return") {
        process.stdout.write("\nDo you want to run this command? (Y/N) ");
        stdin.removeAllListeners("keypress");
        stdin.addListener("data", confirmCallback);
        return;
    }

    // Write the command to the console
    process.stdout.write('\r' + ' '.repeat(process.stdout.columns) + '\r');
    process.stdout.write(`<< [${cmdIdx+1}/${commands.length}] << ` + pc.gray(commands[cmdIdx]));
})

// Prompt the user Y/N to run the command
function confirmCallback(d: any) {
    const input = d.toString().trim().toUpperCase();
    if (input === "Y") {
        console.log("Y\nRunning command...\n");
        execSync(commands[cmdIdx], { stdio: "inherit" });
    } else if (input === "N") {
        console.log("N\nExiting...");
    }
    process.exit();
}