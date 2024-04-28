import fs from 'fs';
import pc from "picocolors"

type LxConfig = {
    api: string;
    model: string;
}

const CONFIG_DIR = `${process.env.HOME}/.config/lx`;
const CONFIG_FILE = `${CONFIG_DIR}/lx.config.json`;
const defaultConfig: LxConfig = {
    api: 'http://127.0.0.1:11434',
    model: 'llama3:8b'
}

if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

if (!fs.existsSync(CONFIG_FILE)) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 4));
}

export function getConfig(): LxConfig {
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    for (const key in defaultConfig) {
        if (!config.hasOwnProperty(key)) {
            throw new Error(`[Config] Missing config key: ${key}`);
        }
    }
    return config;
}

export function handleConfigCommand(argv: string[]) {
    const command = argv[0];
    const config = getConfig();

    switch(command) {
        case 'get':
            console.log(pc.green('[Config] Current config:'));
            console.log(config);
            break;
        case 'reset': 
            fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 4));
            console.log(pc.green('[Config] Config reset to default'));
            console.log(defaultConfig)
            break;
        case 'set':
            const key = argv[1];
            const value = argv[2];
            // TS ties our hands here, so we have to do this
            const configCopy: any = { ...config };

            if (!key || !value) {
                console.error('[Config] Usage: lx conf set <key> <value>');
                return;
            }

            if (config.hasOwnProperty(key)) {
                configCopy[key] = value;
                console.log(pc.green(`[Config] Set ${key} to ${value}`));
            } else {
                console.error(`[Config] Invalid config key: '${key}', valid keys are: '${Object.keys(config).join(', ')}'`);
                return;
            }

            fs.writeFileSync(CONFIG_FILE, JSON.stringify(configCopy, null, 4));
            break;
        default:
            console.error('[Config] Usage: lx conf <get|set|reset>');
            break;
    }
}