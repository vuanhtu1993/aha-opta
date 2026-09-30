# Module WHITE-NOISE — Acceptance Criteria (Gherkin & Boundary Rules)

> **Parent Document:** [Module Spec](spec.md) | [Requirement Analysis Package](../../README.md)  
> **Module ID:** `NOISE` | **Target Audience:** Product Owner, Developer, QA Automation  
> **Linked Documents:** [API Contract](api-contract.md)

---

## 1. Purpose & Boundary Derivation

Acceptance Criteria define the exact boundary conditions governing **Procedural Browser Audio Synthesis**, **Web Audio API Lifecycle Management**, and **Zero-Bandwidth Invariants**, directly enforcing [`BR-07`](../../global/business-rules.md#br-07) and [`ADR-004`](../../governance/adr/004-web-audio-api-synthesis.md).

---

## 2. Acceptance Scenarios (Gherkin)

### AC-NOISE-01: Zero Network Audio Streaming Guarantee
- **Target User Story:** [`US-NOISE-01`](spec.md#us-noise-01)
- **Target Contract:** [`useNoiseGenerator.toggle()`](api-contract.md#11-hook-interface-usenoisegenerator)
- **Governing Business Rule:** [`BR-07`](../../global/business-rules.md#br-07)

```gherkin
Scenario: Play ambient noise with zero HTTP audio requests
  Given the client application is loaded in the browser
    And browser network monitor is active
  When the user taps the play button to start Brown Noise
  Then the Web Audio API "AudioContext" state transitions to "running"
    And sound plays continuously through the hardware speakers
    And exactly 0 network HTTP requests for .mp3 or .wav media files are initiated
```

---

### AC-NOISE-02: Real-Time Spectral Profile Switch
- **Target User Story:** [`US-NOISE-01`](spec.md#us-noise-01)
- **Target Contract:** [`useNoiseGenerator.setNoiseType()`](api-contract.md#11-hook-interface-usenoisegenerator)

```gherkin
Scenario: Switch from Brown Noise to White Noise without audio interruption
  Given audio is actively playing in "brown" noise mode (Biquad lowpass at 400Hz)
  When the user toggles the mode to "white"
  Then the filter node type instantly switches to "allpass"
    And the audio continues looping seamlessly without stopping or re-buffering
```

---

### AC-NOISE-03: Audible Click/Pop Prevention (De-popping)
- **Target User Story:** [`US-NOISE-02`](spec.md#us-noise-02)
- **Target Contract:** [`useNoiseGenerator.setVolume()`](api-contract.md#11-hook-interface-usenoisegenerator)

```gherkin
Scenario: Smooth volume change using exponential decay constant
  Given noise is playing at volume level 40
  When the user rapidly moves the slider to volume level 90
  Then the GainNode applies "setTargetAtTime" with timeConstant <= 0.02s
    And the volume transition occurs without any audible click or pop artifact
```

---

### AC-NOISE-04: AudioContext Resource Cleanup on Unmount
- **Target User Story:** [`US-NOISE-01`](spec.md#us-noise-01)
- **Target Contract:** [`useNoiseGenerator`](api-contract.md#11-hook-interface-usenoisegenerator)

```gherkin
Scenario: Automatically release audio resources when navigating away
  Given noise is actively playing on the "/apps/white-noise" page
  When the learner navigates to another page (e.g., "/vocab")
  Then the "AudioBufferSourceNode" is immediately stopped and disconnected
    And the "AudioContext" is closed to prevent browser memory or battery leaks
```

---

*Made by Anh Tu - Share to be share*
