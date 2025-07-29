import type { Ticker } from "pixi.js";
import { Container } from "pixi.js";
import { WorldController } from "../../engine/world/WorldController";
import { debug } from "../../engine/utils/Debug";

export class MainScreen extends Container {
    public static assetBundles = ["default"];

    public mainContainer: Container;
    private worldController: WorldController;
    private paused = false;

    constructor() {
        super();

        this.mainContainer = new Container();
        this.addChild(this.mainContainer);

        this.worldController = new WorldController(100, 100);
        this.mainContainer.addChild(this.worldController);
    }

    public async prepare() {
        await this.worldController.initialize();
        
        debug().initialize();
        
        this.worldController.generateRandomWorld();
        this.worldController.centerOn(50, 50);
    }

    public update(_time: Ticker) {
        if (this.paused) return;
        
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
        debug().destroy();
        
        this.worldController.destroy();
        super.destroy();
    }
}
