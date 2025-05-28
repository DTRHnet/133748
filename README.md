# 133748

*A CLI/Webapp which leverages [my replay attack PoC]() in a user friendly way. It allows for authentication bypass via broken access control on UG for easy and ad free guitar pro files, including search function and batch downloading.. 133748 =  **“leetab”** or **“elitetab”**).*

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
  1️⃣ *Type* 2️⃣ *Artist* 3️⃣ *Song* 4️⃣ *Tab Type*  
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

```bash
# 1. Clone the repo
git clone https://github.com/DTRHnet/133748
cd 133748

# 2. Install dependencies
npm install

# 3. Build the project
npm run build

---

## Usage

```bash
# Basic search (hierarchical text)
npm run search "metallica one"

# JSON output
npm run search "dream theater" --json

# Interactive TUI (Guitar Pro only)
npm run search -- "plini" --tui

# Directly grab a Guitar Pro tab
node dist/index.js grab \
  https://tabs.ultimate-guitar.com/tab/metallica/one-guitar-pro-54157
```

---

## Development


| Script                     | Purpose                              |
| -------------------------- | ------------------------------------ |
| `npm run build`            | Transpile `src/` → `dist/` via Babel |
| `npm run start`            | Execute `dist/index.js`              |
| `npm run test`             | Run all tests                        |
| `npm run test:integration` | Integration tests                    |
| `npm run test:unit`        | Unit tests                           |
| `npm run lint` / `:fix`    | Lint code (auto-fix with `:fix`)     |
| `npm run format`           | Format with Prettier                 |
| `npm run precommit`        | Run lint-staged before commits       |
| `npm run prepare`          | Set up Husky Git hooks               |

---

admin\[AT\]dtrh\[DOT\]net

## License

Released under the MIT License – see LICENSE for details.
