# ADR-004: In-Browser Web Audio API Mathematical Synthesis for White Noise

> **Status:** `Accepted`  
> **Date:** 2026-09-30  
> **Author:** Anh Tú (Technical Architect)  
> **Mapped Constraint:** `CON-04`

---

## 1. Context & Problem Statement

Ambient background audio (White Noise, Brown Noise, Rain/Fan simulation) is a popular study and focus tool. Traditional web solutions rely on downloading and streaming pre-recorded `.mp3` or `.wav` files:
- **Bandwidth Consumption:** Continuous streaming or downloading 30-minute audio loops consumes 20MB–50MB of mobile data.
- **Audible Loop Gaps:** Audio loops frequently encounter micro-stutters or clicks at the boundary where the track repeats.
- **Storage & CDN Costs:** Hosting high-quality uncompressed audio assets increases cloud infrastructure costs.

---

## 2. Decision Outcome

Implement client-side mathematical sound synthesis using the native browser **Web Audio API** (`AudioContext`, `AudioBufferSourceNode`, `BiquadFilterNode`, `GainNode`):
1. **Procedural Noise Generation:** Generate audio buffer samples mathematically:
   $$\text{sample}[i] = 2 \cdot \text{Math.random}() - 1 \quad \in [-1.0, 1.0]$$
2. **Dynamic Spectral Filtering:**
   - **White Noise:** Unfiltered flat frequency spectrum (`allpass` filter).
   - **Brown Noise:** Lowpass filtering with a cutoff frequency at $400\text{ Hz}$ (`BiquadFilterNode`), attenuating high frequencies to create a soothing rumble resembling heavy rain or a ventilation fan.
3. **De-popping Volume Transitions:** Use `gainNode.gain.setTargetAtTime(target, currentTime, 0.015)` to smoothly transition volume without audible clicking artifacts.

---

## 3. Consequences & Trade-offs

### Positive Impacts (+):
* **Zero Bandwidth Cost:** $0\text{ MB}$ downloaded over the network. Works 100% offline immediately upon PWA load.
* **Infinite Seamless Looping:** Since the buffer is generated in memory and looped natively by the browser audio thread, there is zero loop boundary gap.
* **Instant Responsiveness:** Volume and frequency modulation respond in $<5\text{ms}$ with zero network latency.

### Negative Impacts & Costs (-):
* **CPU Utilization:** Generating samples and applying real-time biquad filtering consumes a marginal amount of client CPU cycles (typically $<1\%$).
* **Fidelity Limits:** Cannot perfectly replicate complex non-stochastic acoustic phenomena (e.g., thunderstorms or chirping birds) without complex procedural audio graphs.

---

*Made by Anh Tu - Share to be share*
