# 133748

_A CLI/Webapp which leverages [my replay attack PoC](https://github.com/DTRHnet/Bug-Bounty-Disclosures/blob/main/%5Bdtrh.net%5D-vuln.01-ultimate-guitar.com.pdf) in a user friendly way. It allows for authentication bypass via broken access control on UG for easy and ad free guitar pro files, including search function and batch downloading.. 133748 = **“leetab”** or **“elitetab”**)._

---

## Description

**133748** is a powerful CLI for searching, previewing, and downloading Ultimate Guitar tabs. It offers lightning-fast search, multiple output formats, and an interactive Terminal User Interface (TUI) that feels right at home in your shell.

---

## Features

### 🔍 Comprehensive Search

Quickly locate tabs for any artist or song on Ultimate Guitar.

### 📦 Multiple Output Formats

- **Hierarchical Plain Text** (default) – neatly organized console output.
- **JSON** – perfect for piping into scripts (`--json`).
- **Interactive TUI** – a full-screen, keyboard-driven explorer (`--tui`).

### 🖥️ TUI Highlights

- **Guitar Pro Filter** – only shows results whose URLs contain `guitar-pro`.
- **Arrow-Key Navigation** – Up/Down/Left/Right to move.
- **Expand / Collapse** – drill into Artists ▸ Songs ▸ Tab Types.
- **Dynamic Sorting** – press  
  1️⃣ *Type* 2️⃣ *Artist* 3️⃣ *Song* 4️⃣ _Tab Type_
- **Toggle Current Level** – `[a]` expands / collapses everything at the current depth.
- **Open URLs** – `Enter` or `→` opens the tab in your browser.
- **Select for Download** – `Space` marks items; **`d`** downloads all marked tabs via `echoHEIST.sh`.
- **Quit** – `q` or `Esc`.

### 📥 Direct Tab Grabber

`grab` command lets you download a single Guitar Pro tab from its URL.

### ⚙️ Configurable

Reads `config/default.yml` for user-tunable settings (if present).

---

## Installation

### Quick Start (Recommended)

```bash
# 1. Clone the repo
git clone https://github.com/DTRHnet/133748
cd 133748

# 2. Run the automated setup (installs dependencies, builds, and configures)
npm install
# OR manually run: node setup.js

# 3. You're ready to go!
```

### Manual Installation

```bash
# 1. Clone the repo
git clone https://github.com/DTRHnet/133748
cd 133748

# 2. Install dependencies
npm install

# 3. Build the project
npm run build

# 4. Run setup to configure the application
node setup.js
```

### System Requirements

- **Node.js** 16+ (recommended: 18+)
- **npm** 8+ (comes with Node.js)
- **Chrome/Chromium** browser (for Puppeteer)
- **curl** (for downloads)

### Platform Support

- ✅ **Windows** (10/11)
- ✅ **macOS** (10.15+)
- ✅ **Linux** (Ubuntu, Debian, CentOS, etc.)

---

## Usage

### Cross-Platform Launchers

**Windows:**

```cmd
run.bat search "metallica one"
run.bat grab https://tabs.ultimate-guitar.com/tab/metallica/one-guitar-pro-54157
```

**Unix-like systems (Linux/macOS):**

```bash
./run.sh search "metallica one"
./run.sh grab https://tabs.ultimate-guitar.com/tab/metallica/one-guitar-pro-54157
```

### NPM Scripts

```bash
# Basic search (hierarchical text)
npm run search "metallica one"

# JSON output
npm run search "dream theater" --json

# Interactive TUI (Guitar Pro only)
npm run search -- "plini" --tui

# Directly grab a Guitar Pro tab
npm run grab https://tabs.ultimate-guitar.com/tab/metallica/one-guitar-pro-54157
```

### Direct Node.js Usage

```bash
# Basic search (hierarchical text)
node dist/index.js search "metallica one"

# JSON output
node dist/index.js search "dream theater" --json

# Interactive TUI (Guitar Pro only)
node dist/index.js search "plini" --tui

# Directly grab a Guitar Pro tab
node dist/index.js grab https://tabs.ultimate-guitar.com/tab/metallica/one-guitar-pro-54157

# Show help
node dist/index.js --help

# Show version
node dist/index.js --version
```

### Standalone echoHEIST Script

```bash
# Basic usage
./echoHEIST.sh https://tabs.ultimate-guitar.com/tab/metallica/one-guitar-pro-54157

# With custom filename
./echoHEIST.sh https://tabs.ultimate-guitar.com/tab/metallica/one-guitar-pro-54157 metallica_one.gpx

# With debug output
DEBUG=1 ./echoHEIST.sh https://tabs.ultimate-guitar.com/tab/metallica/one-guitar-pro-54157

# With custom Chrome path
CHROME_PATH="/path/to/chrome" ./echoHEIST.sh https://tabs.ultimate-guitar.com/tab/metallica/one-guitar-pro-54157
```

---

## Development

### Available Scripts

| Script                     | Purpose                              |
| -------------------------- | ------------------------------------ |
| `npm run build`            | Transpile `src/` → `dist/` via Babel |
| `npm run start`            | Execute `dist/index.js`              |
| `npm run setup`            | Run cross-platform setup script      |
| `npm run clean`            | Clean build directory                |
| `npm run rebuild`          | Clean and rebuild                    |
| `npm run dev`              | Build and start in development mode  |
| `npm run test`             | Run all tests                        |
| `npm run test:integration` | Integration tests                    |
| `npm run test:unit`        | Unit tests                           |
| `npm run test:watch`       | Run tests in watch mode              |
| `npm run lint` / `:fix`    | Lint code (auto-fix with `:fix`)     |
| `npm run format`           | Format with Prettier                 |
| `npm run format:check`     | Check formatting without fixing      |
| `npm run precommit`        | Run lint-staged before commits       |
| `npm run prepare`          | Set up Husky Git hooks               |

### Debugging

The application includes comprehensive debugging information:

- **Debug Logs**: Set `log_level = debug` in `config/default.conf`
- **Environment Variables**:
  - `DEBUG=1` for echoHEIST.sh debug output
  - `CHROME_PATH=/path/to/chrome` for custom Chrome executable
- **Log Files**: Located in `~/.cache/133748/` (or `%USERPROFILE%\.cache\133748\` on Windows)

### Troubleshooting

**Common Issues:**

1. **Chrome/Chromium not found**

   - Install Chrome or Chromium browser
   - Set `chrome_path` in `config/default.conf`
   - Use `CHROME_PATH` environment variable

2. **Build failures**

   - Run `npm run clean && npm run build`
   - Check Node.js version (16+ required)
   - Verify all dependencies are installed

3. **Permission errors (Unix)**

   - Make scripts executable: `chmod +x run.sh echoHEIST.sh`
   - Check file permissions in project directory

4. **Download failures**
   - Verify curl is installed and in PATH
   - Check network connectivity
   - Ensure URL is a valid Guitar Pro tab

**Getting Help:**

- Check logs in `~/.cache/133748/133748.log`
- Run with debug output: `DEBUG=1 ./echoHEIST.sh <URL>`
- Verify configuration: `config/default.conf`

---

admin\[AT\]dtrh\[DOT\]net

## License

Released under the MIT License – see LICENSE for details.
