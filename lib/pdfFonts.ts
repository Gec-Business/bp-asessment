import { Font } from "@react-pdf/renderer";
import fs from "fs";
import path from "path";

let registered = false;

export function registerPdfFonts() {
    if (registered) return;
    registered = true;

    const fonts = [
        { family: "BPG Glaho", file: "BPG_Glaho.ttf" },
        { family: "BPG Glaho Caps", file: "BPG_Glaho_Caps.ttf" },
        { family: "BPG Glaho Bold", file: "BPG_Glaho_Bold.ttf" },
    ];

    for (const { family, file } of fonts) {
        const src = path.join(process.cwd(), "public/fonts", file);
        if (fs.existsSync(src)) {
            Font.register({ family, src });
        } else {
            console.warn(`${family} font missing at ${src}, skipping registration.`);
        }
    }
}
