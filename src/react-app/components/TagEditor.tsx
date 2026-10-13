import { useState } from "react";
import { OTHER } from "../lib/categories";
import { Icon } from "./Icon";
import { Sheet } from "./Sheet";

type Props = {
	categories: string[];
	// How many entries use each tag, so a delete can say how many move to Other.
	uses: Record<string, number>;
	onRename: (from: string, to: string) => void;
	onDelete: (name: string) => void;
	onClose: () => void;
};

// Rename or delete a tag. Other stays: it is where a deleted tag's entries go.
export function TagEditor({ categories, uses, onRename, onDelete, onClose }: Props) {
	const [renaming, setRenaming] = useState<string | null>(null);
	const [draft, setDraft] = useState("");
	const [deleting, setDeleting] = useState<string | null>(null);

	const name = draft.trim();
	const taken = name !== "" && categories.some((c) => c !== renaming && c.toLowerCase() === name.toLowerCase());
	const canSave = name !== "" && !taken;

	function save() {
		if (renaming && canSave) {
			if (name !== renaming) onRename(renaming, name);
			setRenaming(null);
		}
	}

	return (
		<Sheet title="Edit tags" onClose={onClose}>
			<ul className="tag-edit">
				{categories.map((tag) => {
					const count = uses[tag] ?? 0;
					const entries = `${count} ${count === 1 ? "entry" : "entries"}`;
					if (renaming === tag) {
						return (
							<li className="tag-edit__row" key={tag}>
								<form
									className="tag-edit__form"
									onSubmit={(event) => {
										event.preventDefault();
										save();
									}}
								>
									<input
										autoFocus
										className="tag-new__input"
										value={draft}
										onChange={(event) => setDraft(event.target.value)}
										aria-label={`New name for ${tag}`}
										maxLength={24}
									/>
									<button type="submit" className="icon-btn" disabled={!canSave} aria-label="Save the new name">
										<Icon name="check" />
									</button>
									<button type="button" className="icon-btn" onClick={() => setRenaming(null)} aria-label="Cancel renaming">
										<Icon name="close" />
									</button>
								</form>
								{taken && <p className="tag-edit__hint">Another tag already has that name.</p>}
							</li>
						);
					}
					if (deleting === tag) {
						return (
							<li className="tag-edit__row tag-edit__row--ask" key={tag} ref={(el) => el?.scrollIntoView({ block: "nearest" })}>
								<div className="detail__confirm">
									<p className="today__note today__note--warn" role="alert">
										<Icon name="warning" size={18} />
										<span>
											Delete {tag}? {count > 0 ? `${entries} will move to ${OTHER}.` : "No entries use it."} This can't be undone.
										</span>
									</p>
									<button type="button" className="detail__btn detail__btn--keep" onClick={() => setDeleting(null)}>
										Keep it
									</button>
									<button
										type="button"
										className="detail__btn detail__btn--delete"
										onClick={() => {
											onDelete(tag);
											setDeleting(null);
										}}
									>
										Yes, delete
									</button>
								</div>
							</li>
						);
					}
					return (
						<li className="tag-edit__row" key={tag}>
							<span className="tag-edit__name">{tag}</span>
							<span className="tag-edit__uses">{tag === OTHER ? "Always kept" : entries}</span>
							{tag !== OTHER && (
								<>
									<button
										type="button"
										className="icon-btn"
										aria-label={`Rename ${tag}`}
										onClick={() => {
											setRenaming(tag);
											setDraft(tag);
											setDeleting(null);
										}}
									>
										<Icon name="edit" size={18} />
									</button>
									<button
										type="button"
										className="icon-btn"
										aria-label={`Delete ${tag}`}
										onClick={() => {
											setDeleting(tag);
											setRenaming(null);
										}}
									>
										<Icon name="trash" size={18} />
									</button>
								</>
							)}
						</li>
					);
				})}
			</ul>
		</Sheet>
	);
}
