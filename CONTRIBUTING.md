# Contributing to Delta Widgets

First off, thank you for considering contributing to Delta Widgets! It's people like you that make Delta Widgets such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- Use a clear and descriptive title
- Describe the exact steps which reproduce the problem
- Provide specific examples to demonstrate the steps
- Describe the behavior you observed after following the steps
- Explain which behavior you expected to see instead and why
- Include screenshots if possible
- Include your operating system and version
- Include the app version you're using

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- A clear and descriptive title
- A detailed description of the proposed feature
- Explain why this enhancement would be useful
- List any similar features in other applications
- Include screenshots or sketches if relevant

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. Ensure your code follows the existing code style
4. Update the documentation if needed
5. Issue that pull request!

## Development Setup

1. Install the prerequisites:

   - [Node.js](https://nodejs.org/)
   - [Rust](https://www.rust-lang.org/)
   - [VS Code](https://code.visualstudio.com/) (recommended)
   - VS Code extensions:
     - [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
     - [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

2. Clone the repository:

   ```bash
   git clone https://github.com/amaan-mohib/delta-widgets.git
   cd delta-widgets
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   npm run tauri dev
   ```

## Available Scripts

- `npm run dev` - Starts the Vite development server for frontend development
- `npm run build` - Builds the frontend TypeScript and Vite project
- `npm run preview` - Previews the built frontend
- `npm run tauri` - Runs Tauri CLI commands
- `npm run bump` - Bumps the patch version of the app and updates version across all necessary files
- `npm run serve:update` - Serves the project on port 3000 (used for update distribution)
- `npm run gen:latest` - Generates the latest.json file for app updates
- `npm run test:update` - Builds the Tauri app, generates latest.json, and serves for testing updates
- `npm run downgrade` - Helper script for downgrading the app version
- `npm run create:migration` - Creates a new version migration file

For development, you'll primarily use:

```bash
# Start the development server with Tauri
npm run tauri dev

# Build the production app
npm run tauri build
```

## Project Structure

- `/src` - Frontend React code
  - `/creator` - Widget creator interface
  - `/main` - Main application window
  - `/widget` - Widget component code
  - `/types` - TypeScript type definitions
- `/src-tauri` - Rust backend code
  - `/src` - Main Rust source code
    - `main.rs` - Entry point of the Rust application
    - `lib.rs` - Sets up the main Tauri window and handles initial application setup
    - `migration.rs` - Handles version migrations
    - `/commands` - Tauri command implementations
    - `/migrations` - Version migration implementations
    - `/plugins` - Custom Tauri plugin implementations
  - `/capabilities` - Tauri capability configurations
- `/public` - Static assets and widget templates
- `/docs` - Project documentation

## Code Style

- For TypeScript/React code:

  - Use functional components
  - Follow React hooks guidelines
  - Use TypeScript types appropriately
  - Use meaningful variable and function names
  - Comment complex logic

- For Rust code:
  - Follow Rust style guidelines
  - Use meaningful variable and function names
  - Document public functions and types
  - Handle errors appropriately

## License

By contributing, you agree that your contributions will be licensed under the project's license.

## Questions?

Don't hesitate to open an issue for any questions or concerns!
