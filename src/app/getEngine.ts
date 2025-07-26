import type { BeachEngine } from "../engine/engine";

let instance: BeachEngine | null = null;

/**
 * Get the main application engine
 * This is a simple way to access the engine instance from anywhere in the app
 */
export function engine(): BeachEngine {
    return instance!;
}

export function setEngine(app: BeachEngine) {
    instance = app;
}
