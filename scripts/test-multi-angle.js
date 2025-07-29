import path from 'path';
import { fileURLToPath } from 'url';
import { testRenderAllAngles } from './3d-renderer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    const projectRoot = path.dirname(__dirname);
    
    // Test with one of the building models
    const inputGlb = path.join(projectRoot, 'assets/3d/commercial/building-a.glb');
    
    console.log('Testing multi-angle 3D to 2D renderer...');
    console.log(`Input: ${inputGlb}`);
    console.log('Output directory: assets/2d/');
    console.log('Will create: building-a_ne.png, building-a_nw.png, building-a_sw.png, building-a_se.png');
    
    try {
        const results = await testRenderAllAngles(inputGlb);
        console.log('✅ Multi-angle test completed! Check assets/2d/ directory');
    }
    catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

main();
