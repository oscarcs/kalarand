import { Container } from "pixi.js";
import type { UIComponent } from "./types";

/**
 * Central manager for all UI elements in the application
 */
export class UIManager {
    /** Root container for all UI elements */
    public container: Container;
    
    /** Application width */
    public width = 0;
    
    /** Application height */
    public height = 0;
    
    /** List of registered UI components */
    private components: UIComponent[] = [];
    
    /** Whether the UI system is initialized */
    private isInitialized = false;

    constructor() {
        this.container = new Container();
        this.container.label = "UI Root";
        this.container.sortableChildren = true;
        this.container.zIndex = 1000; // Ensure UI is always on top
    }

    /**
     * Initialize the UI manager
     */
    public initialize(): void {
        if (this.isInitialized) return;
        this.isInitialized = true;
    }

    /**
     * Add a UI component to the manager
     */
    public addComponent(component: UIComponent): void {
        this.components.push(component);
        this.container.addChild(component);
    }

    /**
     * Remove a UI component from the manager
     */
    public removeComponent(component: UIComponent): void {
        const index = this.components.indexOf(component);
        if (index !== -1) {
            this.components.splice(index, 1);
            this.container.removeChild(component);
        }
    }

    /**
     * Update all UI components
     */
    public update(): void {
        if (!this.isInitialized) return;
        
        for (const component of this.components) {
            if (component.update) {
                component.update();
            }
        }
    }

    /**
     * Resize all UI components
     */
    public resize(width: number, height: number): void {
        this.width = width;
        this.height = height;
        
        for (const component of this.components) {
            if (component.resize) {
                component.resize(width, height);
            }
        }
    }

    /**
     * Show all UI components
     */
    public async show(): Promise<void> {
        const showPromises = this.components
            .filter(component => component.show)
            .map(component => component.show!());
        
        await Promise.all(showPromises);
    }

    /**
     * Hide all UI components
     */
    public async hide(): Promise<void> {
        const hidePromises = this.components
            .filter(component => component.hide)
            .map(component => component.hide!());
        
        await Promise.all(hidePromises);
    }

    /**
     * Get all components of a specific type
     */
    public getComponentsByType<T extends UIComponent>(type: new (...args: any[]) => T): T[] {
        return this.components.filter(component => component instanceof type) as T[];
    }

    /**
     * Find a component by label
     */
    public getComponentByLabel(label: string): UIComponent | null {
        return this.components.find(component => component.label === label) || null;
    }

    /**
     * Clear all UI components
     */
    public clear(): void {
        // Hide all components first
        for (const component of this.components) {
            if (component.hide) {
                component.hide();
            }
        }
        
        // Remove all components
        for (const component of [...this.components]) {
            this.removeComponent(component);
            component.destroy();
        }
        
        this.components = [];
    }

    /**
     * Clean up the UI manager
     */
    public destroy(): void {
        this.clear();
        this.container.destroy();
        this.isInitialized = false;
    }
}
