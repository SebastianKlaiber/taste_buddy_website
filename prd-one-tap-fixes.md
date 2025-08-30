# Product Requirements Document: IntelliEdit - One-Tap Fixes

**Author:** Gemini
**Date:** August 29, 2025
**Status:** Draft

## 1. Introduction

While the chat interface is powerful, some users desire speed for common, repeatable edits. The "One-Tap Fixes" feature addresses this by providing a library of pre-configured, high-quality adjustments. This serves as both a shortcut for power users and an easy entry point for new users who may not know what to ask for in the chat.

## 2. Goals and Objectives

*   **Primary Goal:** Allow users to apply common, high-quality edits to their photos with a single tap.
*   **Secondary Goals:**
    *   Increase the speed of the editing workflow for common tasks.
    *   Improve the activation rate of new users by providing a simple, non-chat alternative for their first edit.
    *   Showcase the versatility of the AI model through a curated set of effects.

## 3. Target Audience

*   **Primary:** New users who are not yet comfortable with the chat interface.
*   **Secondary:** All users who want to perform a common edit (like enhancing colors or improving lighting) quickly.

## 4. Core Features

*   **Feature: Fixes Gallery**
    *   **Description:** An easily accessible, scrollable gallery of "Fixes" represented by thumbnails that preview the effect. This gallery can be brought up as an alternative to the keyboard in the chat view.
    *   **User Story:** As a new user, I want to see a list of cool effects I can apply so I can try out the app without having to think of a command.

*   **Feature: Curated Set of Fixes**
    *   **Description:** A launch-ready library of high-value, pre-configured AI adjustments. Each fix is a carefully crafted prompt and set of parameters for the "nano banana" model.
    *   **MVP Fixes Library:** "Auto-Enhance," "Fix Lighting," "Portrait Glow," "Foodie" (makes food look more appetizing), "Landscape Pop," "Vintage Film."
    *   **User Story:** As a user, I want to tap a "Foodie" filter to quickly make my lunch photo look great for Instagram.

*   **Feature: Adjustable Intensity**
    *   **Description:** After a fix is applied, a simple slider will appear, allowing the user to adjust the intensity of the effect from 0% to 100%.
    *   **User Story:** As a user, I want to be able to reduce the strength of a filter if it looks too strong.

## 5. User Flow

1.  User imports a photo into the main chat/edit view.
2.  The user can either type a command or tap a "Fixes" icon to open the gallery.
3.  The user scrolls through the gallery and taps on a thumbnail (e.g., "Vintage Film").
4.  The effect is applied to the image, and the gallery is dismissed.
5.  A temporary slider appears, allowing the user to adjust the intensity. The user can then dismiss the slider.
6.  The applied fix appears as an entry in the chat history (e.g., "Applied 'Vintage Film' Fix"), and the user can continue editing via chat commands.

## 6. Non-Goals (for V1 of this feature)

*   Allowing users to create, save, or share their own custom fixes.
*   A complex marketplace for downloading new fixes.
*   AI-based suggestions for which fix to apply.

## 7. Success Metrics

*   **Adoption:** % of editing sessions where at least one One-Tap Fix is used.
*   **Popularity:** A breakdown of which fixes are used most often, to inform future development.
*   **Activation:** % of new users whose first action is to use a One-Tap Fix.
*   **Engagement:** Correlation between using fixes and session length or retention.