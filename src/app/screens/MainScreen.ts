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
            spacing: 8,
            padding: 12,
            uniformButtonSize: true,
            backgroundColor: UIColors.gray[800],
            borderColor: UIColors.gray[600],
            borderWidth: 2,
            cornerRadius: 8,
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
                    variant: 'default',
                    onClick: () => this.activateDrawRoadTool()
                },
                {
                    id: 'raise-land',
                    name: 'Raise Land',
                    icon: '',
                    tooltip: 'Raise terrain height',
                    variant: 'success',
                    onClick: () => this.activateRaiseLandTool()
                },
                {
                    id: 'lower-land',
                    name: 'Lower Land',
                    icon: '',
                    tooltip: 'Lower terrain height',
                    variant: 'warning',
                    onClick: () => this.activateLowerLandTool()
                }
            ]
        });
        
        toolbar.label = "Main Toolbar";
        
        app.ui.addComponent(toolbar);
        this.uiComponents.push(toolbar);
        
        const verticalToolbar = new UIToolbar({
            orientation: 'vertical',
            responsivePosition: {
                anchor: 'top-right',
                offset: { x: -20, y: 20 }
            },
            spacing: 6,
            padding: 10,
            uniformButtonSize: true,
            backgroundColor: UIColors.blue[900],
            borderColor: UIColors.blue[500],
            borderWidth: 1,
            cornerRadius: 12,
            tools: [
                {
                    id: 'save',
                    name: 'Save',
                    icon: '',
                    tooltip: 'Save project',
                    variant: 'success',
                    onClick: () => console.log('Save clicked')
                },
                {
                    id: 'load',
                    name: 'Load',
                    icon: '',
                    tooltip: 'Load project',
                    variant: 'primary',
                    onClick: () => console.log('Load clicked')
                },
                {
                    id: 'delete',
                    name: 'Delete',
                    icon: '',
                    tooltip: 'Delete selection',
                    variant: 'danger',
                    onClick: () => console.log('Delete clicked')
                }
            ]
        });
        
        verticalToolbar.label = "Vertical Toolbar";
        app.ui.addComponent(verticalToolbar);
        this.uiComponents.push(verticalToolbar);
        
        const comparisonToolbar = new UIToolbar({
            orientation: 'horizontal',
            responsivePosition: {
                anchor: 'bottom-left',
                offset: { x: 20, y: -20 }
            },
            spacing: 8,
            padding: 8,
            uniformButtonSize: false,
            backgroundColor: UIColors.green[800],
            borderColor: UIColors.green[500],
            borderWidth: 1,
            cornerRadius: 6,
            tools: [
                {
                    id: 'short',
                    name: 'A',
                    icon: '',
                    onClick: () => console.log('Short button')
                },
                {
                    id: 'medium',
                    name: 'Medium Text',
                    icon: '',
                    onClick: () => console.log('Medium button')
                },
                {
                    id: 'long',
                    name: 'Very Long Button Text',
                    icon: '',
                    onClick: () => console.log('Long button')
                }
            ]
        });
        
        comparisonToolbar.label = "Auto-sized Toolbar";
        app.ui.addComponent(comparisonToolbar);
        this.uiComponents.push(comparisonToolbar);
        
        const centerToolbar = new UIToolbar({
            orientation: 'horizontal',
            responsivePosition: {
                anchor: 'center',
                offset: { x: 0, y: 0 }
            },
            spacing: 12,
            padding: 16,
            uniformButtonSize: true,
            backgroundColor: UIColors.purple[800],
            borderColor: UIColors.purple[400],
            borderWidth: 2,
            cornerRadius: 10,
            tools: [
                {
                    id: 'center-tool-1',
                    name: 'Center 1',
                    icon: '',
                    tooltip: 'First center tool',
                    variant: 'primary',
                    onClick: () => console.log('Center tool 1 clicked')
                },
                {
                    id: 'center-tool-2',
                    name: 'Center 2',
                    icon: '',
                    tooltip: 'Second center tool',
                    variant: 'success',
                    onClick: () => console.log('Center tool 2 clicked')
                },
                {
                    id: 'center-tool-3',
                    name: 'Center 3',
                    icon: '',
                    tooltip: 'Third center tool',
                    variant: 'warning',
                    onClick: () => console.log('Center tool 3 clicked')
                }
            ]
        });
        
        centerToolbar.label = "Center Toolbar";
        app.ui.addComponent(centerToolbar);
        this.uiComponents.push(centerToolbar);
        
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
