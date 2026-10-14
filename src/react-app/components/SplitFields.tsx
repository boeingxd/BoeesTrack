import { useEffect, useRef } from "react";
import { formatBaht } from "../lib/money";
import { newShareId, partOf, splitResult, toText, type Split, type SplitRow } from "../lib/split";
import { Icon } from "./Icon";

type Props = {
	split: Split;
	total: number;
	friends: string[];
	onChange: (split: Split) => void;
};

// Friends owe me: under a spend, one ruled line per friend with their part, then your own share.
export function SplitFields({ split, total, friends, onChange }: Props) {
	const { own } = splitResult(split, total);
	const over = own < 0;
	const focusId = useRef<string | null>(null);
	const list = useRef<HTMLDivElement>(null);

	// A new line puts the cursor in its name field, so adding a friend is one tap then typing.
	useEffect(() => {
		if (!focusId.current) return;
		list.current?.querySelector<HTMLInputElement>(`[data-row="${focusId.current}"]`)?.focus();
		focusId.current = null;
	});

	const setRow = (id: string, patch: Partial<SplitRow>) => onChange({ ...split, rows: split.rows.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
	// Typing a part by hand fixes the others at what they showed, so nothing else moves under your finger.
	const typePart = (id: string, input: string) =>
		onChange({
			even: false,
			rows: split.rows.map((r) => (r.id === id ? { ...r, input } : split.even && !r.settled ? { ...r, input: toText(partOf(split, r, total)) } : r)),
		});
	const add = () => {
		const id = newShareId();
		focusId.current = id;
		onChange({ even: split.rows.length === 0 ? true : split.even, rows: [...split.rows, { id, friend: "", input: "" }] });
	};
	const remove = (id: string) => onChange({ ...split, rows: split.rows.filter((r) => r.id !== id) });
	const open = split.rows.filter((r) => !r.settled);
	const canEven = open.length > 0 && !split.even && !split.rows.some((r) => r.settled);

	return (
		<div className="split" ref={list}>
			<datalist id="friend-names">
				{friends.map((name) => (
					<option key={name} value={name} />
				))}
			</datalist>
			{split.rows.map((row, i) => (
				<div className="field" key={row.id}>
					<span className="field__label" aria-hidden="true">
						{i === 0 ? "Split" : ""}
					</span>
					{row.settled ? (
						<div className="field__body split__row split__row--settled">
							<span className="split__name">{row.friend}</span>
							<span className="split__part">{formatBaht(partOf(split, row, total))}</span>
							<span className="split__state">{row.settled}</span>
						</div>
					) : (
						<div className="field__body split__row">
							<input
								className="note split__name"
								data-row={row.id}
								value={row.friend}
								onChange={(event) => setRow(row.id, { friend: event.target.value })}
								placeholder="Name"
								aria-label={`Friend ${i + 1}, name`}
								list="friend-names"
								autoComplete="off"
								maxLength={50}
							/>
							<label className="split__part">
								<span className="split__cur" aria-hidden="true">
									฿
								</span>
								<input
									className="note split__amount"
									inputMode="decimal"
									value={split.even ? toText(partOf(split, row, total)) : row.input}
									onChange={(event) => typePart(row.id, event.target.value.replace(/[^\d.]/g, ""))}
									placeholder="0"
									aria-label={`${row.friend.trim() || `Friend ${i + 1}`} owes, in baht`}
									maxLength={9}
								/>
							</label>
							<button type="button" className="icon-btn split__remove" onClick={() => remove(row.id)} aria-label={`Remove ${row.friend.trim() || `friend ${i + 1}`}`}>
								<Icon name="close" size={18} />
							</button>
						</div>
					)}
				</div>
			))}
			<div className="field">
				<span className="field__label" aria-hidden="true">
					{split.rows.length === 0 ? "Split" : ""}
				</span>
				<div className="field__body split__actions">
					<button type="button" className="tag tag--add" onClick={add}>
						<Icon name="plus" size={16} />
						{split.rows.length === 0 ? "Friends owe part" : "Another friend"}
					</button>
					{canEven && (
						<button type="button" className="tag" onClick={() => onChange({ ...split, even: true })}>
							Split evenly
						</button>
					)}
				</div>
			</div>
			{split.rows.length > 0 && (
				<div className="field">
					<span className="field__label" aria-hidden="true">
						Yours
					</span>
					<p className={over ? "field__body split__own split__own--over" : "field__body split__own"} aria-live="polite">
						{over ? (
							<>
								<Icon name="warning" size={16} />
								<span>Friends' parts are {formatBaht(-own)} more than the bill</span>
							</>
						) : (
							<>
								<strong>{formatBaht(own)}</strong>
								<span className="split__of">is your share</span>
							</>
						)}
					</p>
				</div>
			)}
		</div>
	);
}
