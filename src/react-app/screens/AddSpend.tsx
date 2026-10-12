import { useRef, useState } from "react";
import { CategoryTags } from "../components/CategoryTags";
import { PotForm } from "../components/PotForm";
import { Icon } from "../components/Icon";
import { toInputValue, whenLabel } from "../lib/dates";
import { formatBaht, groupInput, inputToSatang, pressKey } from "../lib/money";
import type { Entry, Kind, Pot } from "../lib/types";

type Props = {
	// Set to change an existing entry: its kind and pot stay as they were, only the amount, note, date and tag change.
	editing?: Entry;
	categories: string[];
	pots: Pot[];
	goneNames: string[];
	onAddPot: (pot: Pot) => void;
	onAddCategory: (name: string) => void;
	// Reading slips starts from here; not offered while editing an entry.
	onSlips?: () => void;
	// True while there are no entries yet, so the screen says how it works.
	firstRun?: boolean;
	onClose: () => void;
	onSave: (draft: { kind: Kind; satang: number; at: Date; category: string | null; note: string; pot?: string }) => void;
};

const KINDS: { value: Kind; label: string }[] = [
	{ value: "spent", label: "Spent" },
	{ value: "received", label: "Received" },
	{ value: "saved", label: "Saved" },
];

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "back"];

export function AddSpend({ editing, categories, pots, goneNames, onAddPot, onAddCategory, onSlips, firstRun, onClose, onSave }: Props) {
	const [kind, setKind] = useState<Kind>(editing?.kind ?? "spent");
	const [input, setInput] = useState(editing ? String(editing.satang / 100) : "");
	const [note, setNote] = useState(editing?.note ?? "");
	const [at, setAt] = useState(() => editing?.at ?? new Date());
	const [category, setCategory] = useState<string | null>(editing?.category ?? null);
	// Saved money must go into a pot; a spend can optionally be paid from one (null means from the balance).
	const [pot, setPot] = useState<string | null>(editing?.pot ?? null);
	const [makingPot, setMakingPot] = useState(false);
	const whenInput = useRef<HTMLInputElement>(null);

	const satang = inputToSatang(input);
	const potNames = pots.map((p) => p.name);
	const ready = satang > 0 && (kind !== "saved" || pot !== null);
	const verb = editing ? "Save" : kind === "spent" ? "Add" : kind === "received" ? "Add money" : "Set aside";

	return (
		<div className="screen screen--sheet">
			<header className="topbar">
				<button type="button" className="icon-btn" onClick={onClose} aria-label="Close without saving">
					<Icon name="close" />
				</button>
				{editing ? (
					<h1 className="topbar__title">Edit {KINDS.find((k) => k.value === kind)?.label.toLowerCase()}</h1>
				) : (
					<div className="kinds" role="radiogroup" aria-label="What kind of entry">
						{KINDS.map((k) => (
							<button
								key={k.value}
								type="button"
								role="radio"
								aria-checked={kind === k.value}
								className="kind"
								onClick={() => setKind(k.value)}
							>
								{k.label}
							</button>
						))}
					</div>
				)}
				{onSlips && !editing ? (
					<button type="button" className="topbar__slips" onClick={onSlips}>
						<Icon name="clip" size={18} />
						Slips
					</button>
				) : (
					<span className="topbar__spacer" aria-hidden="true" />
				)}
			</header>

			<div className="amount">
				<p className="amount__label" id="amount-label">
					Amount in baht
				</p>
				<p className={ready ? "amount__figure" : "amount__figure amount__figure--empty"} aria-labelledby="amount-label" aria-live="polite">
					<span className="figure__cur">฿</span>
					{groupInput(input)}
				</p>
			</div>

			{firstRun && !editing && <p className="review-intro">Type the amount, pick a tag, then tap Add. Slips (top right) reads bank slip pictures instead.</p>}

			<div className="fields">
				<div className="field">
					<span className="field__label" aria-hidden="true">
						Note
					</span>
					<div className="field__body">
						<input
							className="note"
							value={note}
							onChange={(event) => setNote(event.target.value)}
							placeholder="Add a note"
							aria-label="Note, optional"
							maxLength={80}
						/>
					</div>
				</div>
				<div className="field">
					<span className="field__label" aria-hidden="true">
						When
					</span>
					<label className="when field__body">
						<span>{whenLabel(at, new Date())}</span>
						<span className="when__hint">Change</span>
						<input
							ref={whenInput}
							type="datetime-local"
							className="when__input"
							value={toInputValue(at)}
							aria-label="When it happened"
							onClick={() => whenInput.current?.showPicker?.()}
							onChange={(event) => {
								const next = new Date(event.target.value);
								if (!Number.isNaN(next.getTime())) setAt(next);
							}}
						/>
					</label>
				</div>
				{kind === "saved" && !editing && (
					<div className="field field--tags">
						<span className="field__label" aria-hidden="true">
							Into
						</span>
						<div className="field__body">
							<CategoryTags label="Savings pot" categories={potNames} value={pot} onChange={setPot} onNew={() => setMakingPot(true)} />
						</div>
					</div>
				)}
				{kind === "spent" && !editing && potNames.length > 0 && (
					<div className="field field--tags">
						<span className="field__label" aria-hidden="true">
							Paid from
						</span>
						<div className="field__body">
							<CategoryTags
								label="Paid from"
								categories={["Balance", ...potNames]}
								value={pot ?? "Balance"}
								onChange={(name) => setPot(name === "Balance" ? null : name)}
							/>
						</div>
					</div>
				)}
				{kind === "spent" && (
					<div className="field field--tags">
						<span className="field__label" aria-hidden="true">
							Tag
						</span>
						<div className="field__body">
							<CategoryTags
								label="Category"
								categories={categories}
								value={category}
								onChange={setCategory}
								onAddCategory={onAddCategory}
							/>
						</div>
					</div>
				)}
			</div>
			{kind === "saved" && makingPot && (
				<PotForm
					pots={pots}
					reserved={goneNames}
					submitLabel="Make pot"
					onSubmit={(next) => {
						onAddPot(next);
						setPot(next.name);
						setMakingPot(false);
					}}
					onCancel={() => setMakingPot(false)}
				/>
			)}

			<div className="keys">
				<div className="keys__grid">
					{KEYS.map((key) => (
						<button
							key={key}
							type="button"
							className="key"
							aria-label={key === "back" ? "Delete last digit" : key === "." ? "Decimal point" : key}
							onClick={() => setInput((current) => pressKey(current, key))}
						>
							{key === "back" ? <Icon name="backspace" /> : key}
						</button>
					))}
				</div>
				<button
					type="button"
					className="confirm"
					disabled={!ready}
					onClick={() =>
						onSave({ kind, satang, at, category: kind === "spent" ? category : null, note: note.trim(), ...(kind !== "received" && pot ? { pot } : {}) })
					}
				>
					{satang === 0 ? "Enter an amount" : ready ? `${verb} ${formatBaht(satang)}` : "Pick a pot"}
				</button>
			</div>
		</div>
	);
}
