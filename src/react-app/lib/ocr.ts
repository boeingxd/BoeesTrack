import { createWorker, OEM, PSM, type Block, type Worker } from "tesseract.js";
import { findNameBox, type Box, type OcrLine } from "./nameRead";
import { parseSlip, receiverFromCrop, type SlipFields } from "./slip";

// Everything loads from /ocr (see public/ocr), so a slip image never leaves the phone and nothing comes from a CDN.
// shortcut: the core is the SIMD build, which every current phone runs; an old browser without SIMD would fail, add the plain core then.
export type NameModel = "tha+eng" | "tha" | "eng";

let worker: Promise<Worker> | null = null;
let loaded: NameModel = "tha+eng";

// One worker for the whole session. Switching model reloads about 1-4 MB, so callers read a batch one model at a time.
async function modelWorker(model: NameModel): Promise<Worker> {
	worker ??= createWorker(loaded, OEM.LSTM_ONLY, {
		workerPath: "/ocr/worker.min.js",
		corePath: "/ocr/tesseract-core-simd-lstm.wasm.js",
		langPath: "/ocr",
		gzip: false,
	}).catch((e) => {
		worker = null;
		throw e;
	});
	const w = await worker;
	if (loaded !== model) {
		await w.reinitialize(model, OEM.LSTM_ONLY);
		loaded = model;
	}
	// A slip is one block of text; the default auto mode splits it into pieces and misreads more.
	await w.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_BLOCK });
	return w;
}

// Thai comes back one character at a time, so lines are kept as characters with their left edge.
function toLines(blocks: Block[] | null): OcrLine[] {
	return (blocks ?? []).flatMap((b) =>
		b.paragraphs.flatMap((p) =>
			p.lines.map((l) => ({
				top: l.bbox.y0,
				chars: l.words.flatMap((w) => (w.symbols?.length ? w.symbols.map((s) => ({ text: s.text, x0: s.bbox.x0 })) : [{ text: w.text, x0: w.bbox.x0 }])),
			})),
		),
	);
}

export type FullRead = { fields: SlipFields; box: Box | null };

// First look: the whole slip, for amount, date, reference, and where the receiver's name sits.
export async function readFull(image: Blob): Promise<FullRead> {
	const w = await modelWorker("tha+eng");
	const { data } = await w.recognize(image, {}, { text: true, blocks: true });
	const bitmap = await createImageBitmap(image);
	const box = findNameBox(toLines(data.blocks), bitmap.width, bitmap.height);
	bitmap.close();
	return { fields: parseSlip(data.text), box };
}

// The name area only, enlarged, in black and white stretched to full range: no logo, bigger letters, clearer edges.
export async function cropName(image: Blob, box: Box): Promise<HTMLCanvasElement> {
	const bitmap = await createImageBitmap(image);
	const canvas = document.createElement("canvas");
	canvas.width = box.width * 2;
	canvas.height = box.height * 2;
	const ctx = canvas.getContext("2d", { willReadFrequently: true });
	if (!ctx) throw new Error("no canvas");
	ctx.imageSmoothingQuality = "high";
	ctx.drawImage(bitmap, box.left, box.top, box.width, box.height, 0, 0, canvas.width, canvas.height);
	bitmap.close();
	const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
	const d = pixels.data;
	let lo = 255;
	let hi = 0;
	for (let i = 0; i < d.length; i += 4) {
		const grey = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
		d[i] = grey;
		lo = Math.min(lo, grey);
		hi = Math.max(hi, grey);
	}
	const span = Math.max(1, hi - lo);
	for (let i = 0; i < d.length; i += 4) d[i] = d[i + 1] = d[i + 2] = ((d[i] - lo) * 255) / span;
	ctx.putImageData(pixels, 0, 0);
	return canvas;
}

export async function readName(crop: HTMLCanvasElement, model: NameModel): Promise<string> {
	const w = await modelWorker(model);
	const { data } = await w.recognize(crop);
	return receiverFromCrop(data.text);
}
