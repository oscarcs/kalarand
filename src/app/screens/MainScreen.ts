import type { Ticker } from "pixi.js";
import { Container } from "pixi.js";

export class MainScreen extends Container {
    public static assetBundles = ["main"];

    public mainContainer: Container;
    private paused = false;

    constructor() {
        super();

        this.mainContainer = new Container();
        this.addChild(this.mainContainer);
    }

    public prepare() {

    }

    public update(_time: Ticker) {
        if (this.paused) return;
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
}
