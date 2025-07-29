import type { Ticker } from "pixi.js";
import { Container } from "pixi.js";
import { WorldController } from "../../engine/world/WorldController";
import { debug } from "../../engine/utils/Debug";
import { UIToolbar, UIColors } from "../../engine/ui";
import { engine } from "../getEngine";

export class MainScreen extends Container {
    public static assetBundles = ["default"];

    public mainContainer: Container;
    private worldController: WorldController;
    private paused = false;
    private uiComponents: Container[] = [];

    constructor() {
        super();

        this.mainContainer = new Container();
        this.addChild(this.mainContainer);

        this.worldController = new WorldController(100, 100);
        this.mainContainer.addChild(this.worldController);

        // Listen for window resize events
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    public async prepare() {
        await this.worldController.initialize();
        
        debug().initialize();
        
        this.worldController.generateRandomWorld();
        this.worldController.centerOn(50, 50);
        
        this.setupMainToolbar();
    }
    
    private setupMainToolbar(): void {
        const app = engine();
        
        const toolbar = new UIToolbar({
            orientation: 'horizontal',
            position: { x: 20, y: 20 },
            spacing: 10,
            padding: 10,
            uniformButtonSize: true,
            backgroundColor: UIColors.blue[800],
            borderWidth: 0,
            cornerRadius: 6,
            tools: [
                {
                    id: 'inspector',
                    name: 'Inspector',
                    icon: '',
                    tooltip: 'Inspect objects',
                    variant: 'primary',
                    onClick: () => this.activateInspectorTool()
                },
                {
                    id: 'draw-road',
                    name: 'Draw Road',
                    icon: '',
                    tooltip: 'Draw roads',
                    variant: 'primary',
                    onClick: () => this.activateDrawRoadTool()
                },
                {
                    id: 'raise-land',
                    name: 'Raise Land',
                    icon: '',
                    tooltip: 'Raise terrain height',
                    variant: 'primary',
                    onClick: () => this.activateRaiseLandTool()
                },
                {
                    id: 'lower-land',
                    name: 'Lower Land',
                    icon: '',
                    tooltip: 'Lower terrain height',
                    variant: 'primary',
                    onClick: () => this.activateLowerLandTool()
                }
            ]
        });
        
        toolbar.label = "Main Toolbar";
        
        app.ui.addComponent(toolbar);
        this.uiComponents.push(toolbar);
        
        // Trigger initial resize to set responsive positions
        this.handleResize();
    }
    
    /**
     * Handle window resize events
     */
    private handleResize(): void {
        const app = engine();
        this.uiComponents.forEach(component => {
            if ('resize' in component && typeof component.resize === 'function') {
                component.resize(app.renderer.width, app.renderer.height);
            }
        });
    }

    /**
     * Tool activation methods
     */
    private activateInspectorTool(): void {
        console.log("Inspector tool activated");
    }
    
    private activateDrawRoadTool(): void {
        console.log("Draw Road tool activated");
    }
    
    private activateRaiseLandTool(): void {
        console.log("Raise Land tool activated");
    }
    
    private activateLowerLandTool(): void {
        console.log("Lower Land tool activated");
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
