import { sound } from "@pixi/sound";
import type {
    ApplicationOptions,
    DestroyOptions,
    RendererDestroyOptions,
} from "pixi.js";
import { Application, Assets, extensions, ResizePlugin } from "pixi.js";
import "pixi.js/app";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - This is a dynamically generated file by AssetPack
import manifest from "../manifest.json";

import { BeachAudioPlugin } from "./audio/AudioPlugin";
import { BeachNavigationPlugin } from "./navigation/NavigationPlugin";
import { BeachResizePlugin } from "./resize/ResizePlugin";
import { getResolution } from "./utils/getResolution";

extensions.remove(ResizePlugin);
extensions.add(BeachResizePlugin);
extensions.add(BeachAudioPlugin);
extensions.add(BeachNavigationPlugin);

export class BeachEngine extends Application {
    /** Initialize the application */
    public async init(opts: Partial<ApplicationOptions>): Promise<void> {
        opts.resizeTo ??= window;
        opts.resolution ??= getResolution();

        await super.init(opts);

        // Append the application canvas to the document body
        document.getElementById("pixi-container")!.appendChild(this.canvas);
        // Add a visibility listener, so the app can pause sounds and screens
        document.addEventListener("visibilitychange", this.visibilityChange);

        // Init PixiJS assets with this asset manifest
        await Assets.init({ manifest, basePath: "assets" });
        await Assets.loadBundle("preload");

        // List all existing bundles names
        const allBundles = manifest.bundles.map((item) => item.name);
        // Start up background loading of all bundles
        Assets.backgroundLoadBundle(allBundles);
    }

    public override destroy(
        rendererDestroyOptions: RendererDestroyOptions = false,
        options: DestroyOptions = false,
    ): void {
        document.removeEventListener("visibilitychange", this.visibilityChange);
        super.destroy(rendererDestroyOptions, options);
    }

    /** Fire when document visibility changes - lose or regain focus */
    protected visibilityChange = () => {
        if (document.hidden) {
            sound.pauseAll();
            this.navigation.blur();
        }
        else {
            sound.resumeAll();
            this.navigation.focus();
        }
    };
}
