import { useEffect, useState } from "react";
import * as api from "../lib/api";
import { formatSize } from "../lib/size";
import type { Entry } from "../lib/types";
import { Icon } from "./Icon";
import { Segmented, type Option } from "./ViewSwitch";

const AGES: Option<string>[] = [
	{ value: "3", label: "3 months" },
	{ value: "6", label: "6 months" },
	{ value: "12", label: "12 months" },
];

type Usage = { key: string; count: number; bytes: number } | { key: string; failed: true };

// Removes the pictures of old slip entries to free space. The entries themselves stay. The count and size are asked of the server first, so nothing goes unseen.
export function ClearPictures({ entries, today, onClear }: { entries: Entry[]; today: Date; onClear: (before: Date) => void }) {
	const [open, setOpen] = useState(false);
	const [age, setAge] = useState("6");
	const [usage, setUsage] = useState<Usage | null>(null);
	const [askedKey, setAskedKey] = useState<string | null>(null);

	const months = Number(age);
	const before = new Date(today.getFullYear(), today.getMonth() - months, today.getDate()).getTime();
	// Anything that changes the answer (the age, a picture added or removed) changes the key, which drops the old count and any open question.
	const key = `${before}:${entries.filter((e) => e.hasImage).length}`;

	useEffect(() => {
		if (!open) return;
		let live = true;
		api.slipUsage(new Date(before)).then(
			(found) => live && setUsage({ key, ...found }),
			() => live && setUsage({ key, failed: true }),
		);
		return () => {
			live = false;
		};
	}, [open, key, before]);

	const found = usage?.key === key ? usage : null;
	const confirming = askedKey === key;
	const stored = found && !("failed" in found) ? found : null;

	return (
		<div className="clear-pics">
			<button type="button" className="filters__toggle" aria-expanded={open} aria-controls="clear-pictures" onClick={() => setOpen(!open)}>
				<span>Clear old slip pictures</span>
				<Icon name="down" size={16} />
			</button>
			{open && (
				<div id="clear-pictures" className="clear-pics__body">
					<Segmented label="Remove pictures older than" options={AGES} value={age} onChange={setAge} className="scale scale--field" />
					<p className="clear-pics__status" aria-live="polite">
						{found === null
							? "Counting…"
							: "failed" in found
								? "Couldn't count the pictures."
								: found.count === 0
									? `No pictures older than ${months} months.`
									: `${found.count} ${found.count === 1 ? "picture" : "pictures"} · ${formatSize(found.bytes)}. The entries stay.`}
					</p>
					{stored && stored.count > 0 &&
						(confirming ? (
							<div className="detail__confirm">
								<p className="today__note today__note--warn" role="alert">
									<Icon name="warning" size={18} />
									<span>
										Remove {stored.count} {stored.count === 1 ? "picture" : "pictures"} ({formatSize(stored.bytes)})? This can't be undone.
									</span>
								</p>
								<button type="button" className="detail__btn detail__btn--keep" onClick={() => setAskedKey(null)}>
									Keep them
								</button>
								<button
									type="button"
									className="detail__btn detail__btn--delete"
									onClick={() => {
										setAskedKey(null);
										onClear(new Date(before));
									}}
								>
									Yes, remove
								</button>
							</div>
						) : (
							<button type="button" className="detail__btn detail__btn--outline detail__delete" onClick={() => setAskedKey(key)}>
								Remove these {stored.count} {stored.count === 1 ? "picture" : "pictures"}
							</button>
						))}
				</div>
			)}
		</div>
	);
}
