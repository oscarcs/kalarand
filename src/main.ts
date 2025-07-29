import { setEngine } from "./app/getEngine";
import { MainScreen } from "./app/screens/MainScreen";
import { BeachEngine } from "./engine/engine";

/**
 * Importing these modules will automatically register there plugins with the engine.
 */
import "@pixi/sound";
// import "@esotericsoftware/spine-pixi-v8";

// Create a new creation engine instance
const engine = new BeachEngine();
setEngine(engine);

(async () => {
    // Initialize the creation engine instance
    await engine.init({
        background: "#1E1E1E",
        resizeOptions: { letterbox: false },
    });

    await engine.navigation.showScreen(MainScreen);
})();
