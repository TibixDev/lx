# lx: Your AI-Powered Terminal Sidekick
=====================================

Get ready to level up your terminal game with lx, the AI-driven command-line assistant that's got your back!

**How it Works**
---------------

1. Install the dependencies with `bun install`
2. Compile lx using `bun run compile`.
2. Copy the resulting `lx` executable to `/usr/local/bin/lx` (or any other location in your system's PATH).
3. Run lx by executing `lx` in your terminal.
4. Give it a task or prompt, like `lx fix npm permissions` or `lx install Docker`.
5. lx will whip up a list of possible commands to get the job done.
6. Use the arrow keys to navigate through the list, and press Enter to select a command.
7. Type 'Y' to run the command, or 'N' to bail out.

**Customize to Your Heart's Content**
-----------------------------------

lx uses a config file at `~/.config/lx/lx.config.json`. Tweak it to your liking to change the API endpoint or model. Want to try out a different Ollama model? Just update the `model` key and you're good to go!

**Config Commands**
-----------------

* `lx conf get`: Peek at your current config.
* `lx conf reset`: Reset to default settings.
* `lx conf set <key> <value>`: Update a specific config key.

**Requirements**
---------------

* Bun installed on your system.
* Ollama installed and running on your system.
* Install the required packages with `bun install`.

**License**
---------

lx is licensed under the MIT License. See the LICENSE file for details.

**Get Involved**
----------------

Want to contribute to lx? Open a pull request with your changes and let's make this project even more awesome!