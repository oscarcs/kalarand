import type { BGM, SFX } from "./engine/audio/audio";
import type { Navigation } from "./engine/navigation/navigation";
import type {
    CreationResizePluginOptions,
    DeepRequired,
} from "./engine/resize/ResizePlugin";
import type { UIManager } from "./engine/ui/UIManager";

declare global {
    namespace PixiMixins {
        interface Application extends DeepRequired<CreationResizePluginOptions> {
            audio: {
                bgm: BGM;
                sfx: SFX;
                getMasterVolume: () => number;
                setMasterVolume: (volume: number) => void;
            };
            navigation: Navigation;
            ui: UIManager;
        }
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        interface ApplicationOptions extends CreationResizePluginOptions { }
    }
}

export { };
