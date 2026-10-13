import { useState } from "react";
import { Icon } from "./Icon";

type Props = {
	label: string;
	categories: string[];
	value: string | null;
	onChange: (category: string) => void;
	onAddCategory?: (name: string) => void;
	// When given, the "New" tag calls this instead of asking for a name inline (used for pots, which need more than a name).
	onNew?: () => void;
	// When given, an "Edit" tag after "New" opens the rename and delete sheet.
	onManage?: () => void;
};

// Categories are plain text tags in one ink colour; the chosen one is underlined.
export function CategoryTags({ label, categories, value, onChange, onAddCategory, onNew, onManage }: Props) {
	const [adding, setAdding] = useState(false);
	const [draft, setDraft] = useState("");

	function commit() {
		const name = draft.trim();
		if (name && onAddCategory) {
			onAddCategory(name);
			onChange(name);
		}
		setDraft("");
		setAdding(false);
	}

	return (
		<div className="tags" role="radiogroup" aria-label={label}>
			{categories.map((name) => (
				<button
					key={name}
					type="button"
					role="radio"
					aria-checked={value === name}
					className="tag"
					onClick={() => onChange(name)}
				>
					{name}
				</button>
			))}
			{onNew ? (
				<button type="button" className="tag tag--add" onClick={onNew}>
					<Icon name="plus" size={16} />
					New
				</button>
			) : (
				onAddCategory &&
				(adding ? (
					<form
						className="tag-new"
						onSubmit={(event) => {
							event.preventDefault();
							commit();
						}}
					>
						<input
							autoFocus
							className="tag-new__input"
							value={draft}
							onChange={(event) => setDraft(event.target.value)}
							onBlur={commit}
							aria-label="New category name"
							placeholder="Category name"
							maxLength={24}
						/>
					</form>
				) : (
					<button type="button" className="tag tag--add" onClick={() => setAdding(true)}>
						<Icon name="plus" size={16} />
						New
					</button>
				)))}
			{onManage && !adding && (
				<button type="button" className="tag tag--add" onClick={onManage}>
					<Icon name="edit" size={16} />
					Edit
				</button>
			)}
		</div>
	);
}
