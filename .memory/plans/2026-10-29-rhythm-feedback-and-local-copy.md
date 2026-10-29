# Plan: Rhythm Feedback and Local-Play Copy

## Goal
Remove user-facing local-play branding while preserving meaningful save warnings, then make rhythm-target hits, misclicks, and timeouts visually distinguishable. Misclicks must reduce rhythm accuracy without consuming the active target, and each canvas feedback animation must last 400 ms.

## Scope
- Mobile-specific controls for secondary targets are excluded; secondary targets continue to use the existing right-mouse-button input.

## Phases
| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `complete` | Clean local-play copy, count rhythm misclicks, and animate hit/miss feedback. | [P01](../phases/2026-10-29-rhythm-feedback-and-local-copy/P01-feedback-and-copy/phase.md) |
