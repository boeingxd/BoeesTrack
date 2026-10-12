import { createWorker, OEM, type Worker } from "tesseract.js";
import { parseSlip, type SlipFields } from "./slip";

// Everything loads from /ocr (see public/ocr), so a slip image never leaves the phone and nothing comes from a CDN.
// shortcut: the core is the SIMD build, which every current phone runs; an old browser without SIMD would fail, add the plain core then.
let worker: Promise<Worker> | null = null;

function getWorker(): Promise<Worker> {
	worker ??= createWorker(["tha", "eng"], OEM.LSTM_ONLY, {
		workerPath: "/ocr/worker.min.js",
		corePath: "/ocr/tesseract-core-simd-lstm.wasm.js",
		langPath: "/ocr",
		gzip: false,
	}).catch((e) => {
		worker = null;
		throw e;
	});
	return worker;
}

export async function readSlip(image: File | Blob): Promise<SlipFields> {
	const { data } = await (await getWorker()).recognize(image);
	return parseSlip(data.text);
}
