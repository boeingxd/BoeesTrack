import { useState } from "react";
import { Icon } from "./Icon";

type Props = {
	label: string;
	categories: string[];
	value: string | null;
	onChange: (category: string) => void;
	onAddCategory?: (name: string) => void;
};

// Categories are plain text tags in one ink colour; the chosen one is underlined.
export function CategoryTags({ label, categories, value, onChange, onAddCategory }: Props) {
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
			{onAddCategory &&
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
				))}
		</div>
	);
}
