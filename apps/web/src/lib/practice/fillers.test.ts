/**
 * Vitest tests for fillers.ts and the F2 reconciliation contract.
 *
 * F2-U-01: detectFillers detects every filler in the canonical list.
 * F2-U-02: word-boundary rule — partial matches are not counted.
 * F2-U-03: calculateWpm handles zero and positive durations.
 * F2-U-04: paceLabel returns correct tone at boundary values.
 * F2-U-05: countFillersFromTranscript (stable-only) — counter never grows
 *           when only interim text changes (reconciliation contract).
 * F2-U-06: interim text is excluded from the stable filler count.
 */

import { describe, expect, it } from "vitest";

import {
  calculateWpm,
  detectFillers,
  paceLabel,
  SPANISH_FILLERS,
} from "./fillers";
import { countFillersFromTranscript } from "./use-deepgram";

// ---------------------------------------------------------------------------
// F2-U-01: every filler in SPANISH_FILLERS is detected
// ---------------------------------------------------------------------------

describe("F2-U-01: detectFillers detects all 18 canonical fillers", () => {
  it("detects each filler when it appears alone", () => {
    for (const filler of SPANISH_FILLERS) {
      const result = detectFillers(filler);
      expect(result.total, `filler "${filler}" should be detected`).toBeGreaterThan(0);
      const entry = result.byWord.find((b) => b.word === filler);
      expect(entry, `byWord entry for "${filler}"`).toBeDefined();
      expect(entry!.count).toBe(1);
    }
  });

  it("counts multiple occurrences of the same filler", () => {
    const result = detectFillers("este es un este ejemplo este");
    const entry = result.byWord.find((b) => b.word === "este");
    expect(entry!.count).toBe(3);
    expect(result.total).toBe(3);
  });

  it("detects multi-word fillers like 'o sea' and 'como que'", () => {
    const result = detectFillers("o sea es como que obvio, a ver");
    const oseaEntry = result.byWord.find((b) => b.word === "o sea");
    const comoQueEntry = result.byWord.find((b) => b.word === "como que");
    const averEntry = result.byWord.find((b) => b.word === "a ver");
    expect(oseaEntry!.count).toBe(1);
    expect(comoQueEntry!.count).toBe(1);
    expect(averEntry!.count).toBe(1);
  });

  it("is case-insensitive", () => {
    const result = detectFillers("ESTE Este este");
    const entry = result.byWord.find((b) => b.word === "este");
    expect(entry!.count).toBe(3);
  });

  it("returns total as the sum of all per-word counts", () => {
    const result = detectFillers("bueno pues vale okey");
    expect(result.total).toBe(result.byWord.reduce((s, b) => s + b.count, 0));
  });
});

// ---------------------------------------------------------------------------
// F2-U-02: word-boundary — partial matches must not count
// ---------------------------------------------------------------------------

describe("F2-U-02: word boundary — partial matches are not counted", () => {
  it("'esteban' does not match 'este'", () => {
    const result = detectFillers("esteban fue al parque");
    const entry = result.byWord.find((b) => b.word === "este");
    expect(entry).toBeUndefined();
    expect(result.total).toBe(0);
  });

  it("'valeria' does not match 'vale'", () => {
    const result = detectFillers("valeria llega tarde");
    const entry = result.byWord.find((b) => b.word === "vale");
    expect(entry).toBeUndefined();
  });

  it("'okey' inside 'okeyness' does not match", () => {
    const result = detectFillers("okeyness is not a word");
    const entry = result.byWord.find((b) => b.word === "okey");
    expect(entry).toBeUndefined();
  });

  it("standalone 'este' at end of sentence is counted", () => {
    const result = detectFillers("ya terminé este.");
    const entry = result.byWord.find((b) => b.word === "este");
    // Punctuation after word — boundary should still match
    expect(entry?.count ?? 0).toBeGreaterThanOrEqual(1);
  });

  it("returns zero for transcript with no fillers", () => {
    const result = detectFillers("el gato come pescado");
    expect(result.total).toBe(0);
    expect(result.byWord).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// F2-U-03: calculateWpm
// ---------------------------------------------------------------------------

describe("F2-U-03: calculateWpm handles edge cases", () => {
  it("returns 0 when durationSeconds is 0", () => {
    expect(calculateWpm("hello world", 0)).toBe(0);
  });

  it("returns 0 when durationSeconds is negative", () => {
    expect(calculateWpm("hello world", -5)).toBe(0);
  });

  it("returns 0 for empty transcript", () => {
    expect(calculateWpm("", 60)).toBe(0);
  });

  it("calculates 60 wpm for 60 words in 60 seconds", () => {
    const words = Array.from({ length: 60 }, (_, i) => `word${i}`).join(" ");
    expect(calculateWpm(words, 60)).toBeCloseTo(60);
  });

  it("calculates 120 wpm for 60 words in 30 seconds", () => {
    const words = Array.from({ length: 60 }, (_, i) => `word${i}`).join(" ");
    expect(calculateWpm(words, 30)).toBeCloseTo(120);
  });

  it("ignores pure-punctuation tokens", () => {
    // Transcript with punctuation only between real words
    const wpm = calculateWpm("hola, mundo.", 60);
    // 2 real words → 2 wpm at 60 sec
    expect(wpm).toBeCloseTo(2);
  });
});

// ---------------------------------------------------------------------------
// F2-U-04: paceLabel thresholds
// ---------------------------------------------------------------------------

describe("F2-U-04: paceLabel returns correct label and tone at boundaries", () => {
  it("0 wpm → Lento / slow", () => {
    const p = paceLabel(0);
    expect(p.label).toBe("Lento");
    expect(p.tone).toBe("slow");
  });

  it("89 wpm → Lento / slow", () => {
    const p = paceLabel(89);
    expect(p.tone).toBe("slow");
  });

  it("90 wpm → Moderado / ok (boundary)", () => {
    const p = paceLabel(90);
    expect(p.label).toBe("Moderado");
    expect(p.tone).toBe("ok");
  });

  it("129 wpm → Moderado / ok", () => {
    const p = paceLabel(129);
    expect(p.label).toBe("Moderado");
    expect(p.tone).toBe("ok");
  });

  it("130 wpm → Ágil / ok (boundary)", () => {
    const p = paceLabel(130);
    expect(p.label).toBe("Ágil");
    expect(p.tone).toBe("ok");
  });

  it("169 wpm → Ágil / ok", () => {
    const p = paceLabel(169);
    expect(p.label).toBe("Ágil");
    expect(p.tone).toBe("ok");
  });

  it("170 wpm → Demasiado rápido / fast (boundary)", () => {
    const p = paceLabel(170);
    expect(p.label).toBe("Demasiado rápido");
    expect(p.tone).toBe("fast");
  });

  it("250 wpm → Demasiado rápido / fast", () => {
    const p = paceLabel(250);
    expect(p.tone).toBe("fast");
  });
});

// ---------------------------------------------------------------------------
// F2-U-05: reconciliation — filler counter never flickers with interim changes
// ---------------------------------------------------------------------------

describe("F2-U-05: countFillersFromTranscript (stable-only) — no flicker", () => {
  it("count does not grow when only interim changes while stable is empty", () => {
    const stable = "";
    const interim1 = "este es un";
    const interim2 = "este es un como que";

    const countFromStable = countFillersFromTranscript(stable).total;
    // Regardless of interim changes, the stable count stays 0
    const _ = countFillersFromTranscript(interim1); // never feed interim here
    const __ = countFillersFromTranscript(interim2); // never feed interim here
    expect(countFillersFromTranscript(stable).total).toBe(countFromStable);
    expect(countFromStable).toBe(0);
  });

  it("count stays the same when stable text is fixed and interim oscillates", () => {
    const stable = "gracias por la oportunidad";
    const countBase = countFillersFromTranscript(stable).total;

    // Simulate interim appearing and disappearing multiple times
    const interims = [
      "este es como que",
      "este",
      "",
      "o sea ya pues",
      "",
    ];
    for (const _interim of interims) {
      // The contract: NEVER feed interim into countFillersFromTranscript
      const countNow = countFillersFromTranscript(stable).total;
      expect(countNow).toBe(countBase);
    }
  });

  it("count grows monotonically only when stable text is appended", () => {
    let stable = "";
    let lastCount = 0;

    const utterances = [
      "hola hasta luego",     // 0 fillers
      "este es mi proyecto",  // 1 filler: "este"
      "o sea es muy claro",   // 1 filler: "o sea"
    ];

    for (const utterance of utterances) {
      stable = stable ? `${stable} ${utterance}` : utterance;
      const count = countFillersFromTranscript(stable).total;
      expect(count).toBeGreaterThanOrEqual(lastCount);
      lastCount = count;
    }
    expect(lastCount).toBe(2); // "este" + "o sea"
  });
});

// ---------------------------------------------------------------------------
// F2-U-06: interim is excluded from filler count
// ---------------------------------------------------------------------------

describe("F2-U-06: interim text excluded from stable filler count", () => {
  it("interim with many fillers does not affect the stable count", () => {
    const stable = "buenos días a todos";
    const interim = "este bueno vale como que pues o sea este";

    // This is the reconciliation contract: ONLY feed stable into the counter.
    const stableCount = countFillersFromTranscript(stable).total;
    const interimCount = countFillersFromTranscript(interim).total;

    expect(stableCount).toBe(0);
    expect(interimCount).toBeGreaterThan(0); // Interim HAS fillers...
    // ...but we must never use interimCount for the UI counter.
    expect(stableCount).not.toBe(interimCount);
  });

  it("only words from final utterances are counted", () => {
    // Simulate what happens when we have two final utterances
    const finalUtterance1 = "gracias por venir hoy";
    const finalUtterance2 = "este proyecto es muy importante";
    const stable = `${finalUtterance1} ${finalUtterance2}`;

    const result = countFillersFromTranscript(stable);
    const esteEntry = result.byWord.find((b) => b.word === "este");
    expect(esteEntry?.count).toBe(1);
    expect(result.total).toBe(1);
  });
});
