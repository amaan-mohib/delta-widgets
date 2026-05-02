# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

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
