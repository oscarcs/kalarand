import type { Ticker } from "pixi.js";
import { Container } from "pixi.js";
import { WorldController } from "../../engine/world/WorldController";

export class MainScreen extends Container {
    public static assetBundles = ["default"];

    public mainContainer: Container;
    private worldController: WorldController;
    private paused = false;

    constructor() {
        super();

        this.mainContainer = new Container();
        this.addChild(this.mainContainer);

        // Create the world controller for a 100x100 world
        this.worldController = new WorldController(100, 100);
        this.mainContainer.addChild(this.worldController);
    }

    public async prepare() {
        // Initialize the world controller
        await this.worldController.initialize();
        
        // Generate and render the random world
        this.worldController.generateRandomWorld();
        
        // Center the world view
        this.worldController.centerOn(50, 50);
    }

    public update(_time: Ticker) {
        if (this.paused) return;
        
        // Update the world controller which handles camera and input
        this.worldController.update();
    }

    public async pause() {
        this.mainContainer.interactiveChildren = false;
        this.paused = true;
    }

    public async resume() {
        this.mainContainer.interactiveChildren = true;
        this.paused = false;
    }

    public reset() {

    }

    public resize(width: number, height: number) {
        const centerX = width * 0.5;
        const centerY = height * 0.5;

        this.mainContainer.x = centerX;
        this.mainContainer.y = centerY;
    }

    public async show(): Promise<void> {

    }

    public async hide() {

    }

    public blur() {

    }

    /**
     * Clean up resources when screen is destroyed
     */
    public destroy(): void {
        this.worldController.destroy();
        super.destroy();
    }
}
