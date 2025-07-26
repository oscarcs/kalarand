import { screenToWorldMovement } from "../world/IsometricUtils";

/**
 * Input controller for handling keyboard input
 */
export class InputController {
    private keys: Set<string> = new Set();
    private listeners: Map<string, (() => void)[]> = new Map();
    private lastZoomTime: number = 0;
    private zoomCooldown: number = 150; // ms between zoom actions

    constructor() {
        this.setupEventListeners();
    }

    /**
     * Set up keyboard event listeners
     */
    private setupEventListeners(): void {
        document.addEventListener('keydown', (event) => {
            this.keys.add(event.code);
            this.triggerKeyListeners(event.code, 'down');
        });

        document.addEventListener('keyup', (event) => {
            this.keys.delete(event.code);
            this.triggerKeyListeners(event.code, 'up');
        });

        // Handle window focus/blur to clear keys
        window.addEventListener('blur', () => {
            this.keys.clear();
        });
    }

    /**
     * Check if a key is currently pressed
     */
    public isKeyPressed(keyCode: string): boolean {
        return this.keys.has(keyCode);
    }

    /**
     * Check if any of the provided keys are pressed
     */
    public areAnyKeysPressed(keyCodes: string[]): boolean {
        return keyCodes.some(key => this.keys.has(key));
    }

    /**
     * Get movement input as a direction vector
     */
    public getMovementInput(): { x: number; y: number } {
        let x = 0;
        let y = 0;

        // Arrow keys
        if (this.isKeyPressed('ArrowLeft') || this.isKeyPressed('KeyA')) {
            x -= 1;
        }
        if (this.isKeyPressed('ArrowRight') || this.isKeyPressed('KeyD')) {
            x += 1;
        }
        if (this.isKeyPressed('ArrowUp') || this.isKeyPressed('KeyW')) {
            y -= 1;
        }
        if (this.isKeyPressed('ArrowDown') || this.isKeyPressed('KeyS')) {
            y += 1;
        }

        return { x, y };
    }

    /**
     * Get zoom input with cooldown to prevent rapid zooming
     */
    public getZoomInput(): { zoomIn: boolean; zoomOut: boolean } {
        const now = Date.now();
        const canZoom = now - this.lastZoomTime > this.zoomCooldown;
        
        let zoomIn = false;
        let zoomOut = false;
        
        if (canZoom) {
            if (this.isKeyPressed('Equal')) { // = key
                zoomIn = true;
                this.lastZoomTime = now;
            }
            else if (this.isKeyPressed('Minus')) { // - key
                zoomOut = true;
                this.lastZoomTime = now;
            }
        }
        
        return { zoomIn, zoomOut };
    }

    /**
     * Get movement input relative to screen coordinates (for isometric view)
     * This converts screen-relative input to world-relative movement
     */
    public getIsometricMovementInput(): { worldX: number; worldY: number } {
        const screenInput = this.getMovementInput();
        const worldMovement = screenToWorldMovement(screenInput.x, screenInput.y);
        
        return { worldX: worldMovement.x, worldY: worldMovement.y };
    }

    /**
     * Add a listener for a specific key event
     */
    public addKeyListener(keyCode: string, type: 'down' | 'up', callback: () => void): void {
        const key = `${keyCode}_${type}`;
        if (!this.listeners.has(key)) {
            this.listeners.set(key, []);
        }
        this.listeners.get(key)!.push(callback);
    }

    /**
     * Remove a key listener
     */
    public removeKeyListener(keyCode: string, type: 'down' | 'up', callback: () => void): void {
        const key = `${keyCode}_${type}`;
        const callbacks = this.listeners.get(key);
        if (callbacks) {
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    /**
     * Trigger listeners for a specific key event
     */
    private triggerKeyListeners(keyCode: string, type: 'down' | 'up'): void {
        const key = `${keyCode}_${type}`;
        const callbacks = this.listeners.get(key);
        if (callbacks) {
            callbacks.forEach(callback => callback());
        }
    }

    /**
     * Clean up event listeners
     */
    public destroy(): void {
        document.removeEventListener('keydown', this.setupEventListeners);
        document.removeEventListener('keyup', this.setupEventListeners);
        window.removeEventListener('blur', this.setupEventListeners);
        this.keys.clear();
        this.listeners.clear();
    }
}
