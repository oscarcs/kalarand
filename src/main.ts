import { setEngine } from "./app/getEngine";
import { MainScreen } from "./app/screens/MainScreen";
import { BeachEngine } from "./engine/engine";
import "@pixi/sound";

const engine = new BeachEngine();
setEngine(engine);

(async () => {
    await engine.init({
        background: "#1E1E1E",
        resizeOptions: { letterbox: false },
    });

    await engine.navigation.showScreen(MainScreen);
})();
