# Implementation Plan - Tizen Port Preparation

This plan outlines the steps to prepare the IPTV Pro Player for deployment as a Samsung Tizen Smart TV Web Application.

## Proposed Changes

### Tizen Configuration

#### [NEW] [config.xml](file:///c:/Users/abdel/OneDrive/Desktop/IPTV%20PLAYER/config.xml)
Create the W3C widget configuration file required by the Tizen web app packager.
* Target Tizen profile: `tv-samsung`
* Application ID and Package ID definitions
* Entry point set to `iptv-pro-player.html`
* Requested privileges: `internet` and `tv.inputdevice` (for remote keys registration)

### Remote Control Keys Handling

#### [MODIFY] [main.js](file:///c:/Users/abdel/OneDrive/Desktop/IPTV%20PLAYER/src/main.js)
Update the keydown listener to support Tizen remote control keys:
* Register Tizen input device keys (`registerKey`) on startup if running on a Tizen environment.
* Map Tizen hardware keys:
  * `10009` (Return/Back) -> closes current modal, or exits the app if on the main page.
  * `415` (Play), `19` (Pause) -> control video playback.
  * `413` (Stop) -> stop and close video player.
  * `417` (Fast Forward), `412` (Rewind) -> skip forward/backward.

#### [NEW] [tizen-helper.js](file:///c:/Users/abdel/OneDrive/Desktop/IPTV%20PLAYER/src/utils/tizen-helper.js)
Helper utility to check for Tizen environment, register remote keys, and exit the application gracefully via Tizen APIs.

## Verification Plan

### Manual Verification
1. Verify `config.xml` is present in the root of the project workspace.
2. Verify that keyboard controls still work perfectly in the browser (no regressions).
3. Test Tizen key codes (e.g. keycode `10009` for Back) via simulated keyboard events in browser console to confirm modal closing works as expected.
