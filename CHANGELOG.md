# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.0.5] - 2026-10-01

### New Features

- Added Community Gallery integration.
- Added support for renaming custom widgets.
- Added widget settings support.
- Added duplicate widget event.
- Added close widget event.
- Added deep link support and application deep link handling.
- Added widget download functionality.
- Added notifications component.
- Added background asset path retrieval for widgets.
- Added asset path retrieval APIs for widget resources.

### Improvements

- Enhanced image and text properties with weather city and date configuration dialogs.
- Improved widget state management and data handling.
- Improved screenshot handling and HTML widget bundling documentation.
- Streamlined image handling across components.
- Improved changelog structure.
- Refactored widget list components.
- Refactored analytics functions into a shared common module.
- Refactored type definitions and internal data handling.
- Replaced initialization scripts with search parameter based configuration.
- Updated event documentation.
- Applied dependency updates and code quality improvements.

### Community Gallery

- Introduced initial Community Gallery infrastructure.
- Added gallery upload workflow.
- Enhanced gallery integration throughout the application.
- Improved widget download and installation flow.

### Other Changes

- Updated default thumbnail behavior for widgets without media.
- Various internal refactors, cleanup, and stability improvements.

## [1.0.4] - 2026-07-26

### Added

- Added AI Assistant to create widgets, completely optional with BYOK architecture.
- Added SQLite database to locally persist AI chat messages and media history.

### Fixed

- Fixed documentation for internal global Tauri commands.

## [1.0.3] - 2026-05-02

### Fixed

- Improve media and audio fetching with stale checks

## [1.0.2] - 2026-04-29

### Added

- Added the audio visualizer backend and components to support waveform display and visual effects.
- Added new `visualizer` and `media visualizer` widgets, including associated migrations.
- Added loudness normalization for audio playback.
- Added manual HTML refresh support for widget content updates.
- Added editing controls for widgets.
- Added media player icon for Win32 applications.
- Added widget pinned toggle support on cards.
- Enhanced resizable widget handles for improved interaction.
- Implemented URL thumbnail creation.
- Added changelog

### Changed

- Refactored application initialization and setup flow.
- Centralized Tauri commands into a shared command module.
- Updated `write_to_store_cmd` to accept multiple key/value pairs.
- Added a services module and reorganized command handling.
- Refactored media fetching logic.
- General refactor and optimization across the widget system.

### Fixed

- Fixed Cargo version synchronization.
- Fixed widget position type to allow optional coordinates.
- Set a default widget position when none is specified.
