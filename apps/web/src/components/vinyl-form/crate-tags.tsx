"use client";

import { useQuery } from "@tanstack/react-query";
import { cn } from "@dallateas/ui/lib/utils";
import { X } from "lucide-react";
import { useState } from "react";

import { trpc } from "@/utils/trpc";

import { controlClass, Field, FormSection } from "./field";

const MAX_SUGGESTIONS = 10;

const CHIP = "inline-flex min-h-11 items-center gap-1.5 rounded-sm px-3 text-[13px] font-medium transition-colors duration-[120ms] md:min-h-8";

type FolderFieldProps = {
  folderIds: string[];
  onChange: (folderIds: string[]) => void;
};

function FolderField({ folderIds, onChange }: FolderFieldProps) {
  const { data: folders = [] } = useQuery(trpc.foldersList.queryOptions());

  if (folders.length === 0) return <p className="text-[13px] text-muted-foreground">Todavía no tenés carpetas</p>;

  return (
    <div role="group" aria-label="Carpetas" className="flex flex-wrap gap-2">
      {folders.map(({ id, name }) => {
        const selected = folderIds.includes(id);
        return (
          <button
            key={id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(selected ? folderIds.filter((folderId) => folderId !== id) : [...folderIds, id])}
            className={cn(CHIP, selected ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}
          >
            {name}
          </button>
        );
      })}
    </div>
  );
}

type TagFieldProps = {
  tagNames: string[];
  onChange: (tagNames: string[]) => void;
};

function TagField({ tagNames, onChange }: TagFieldProps) {
  const [text, setText] = useState("");
  const { data: tags = [] } = useQuery(trpc.tagsList.queryOptions());
  const suggestions = tags.filter(({ name }) => !tagNames.includes(name)).slice(0, MAX_SUGGESTIONS);

  function addTyped() {
    const name = text.trim();
    if (!name) return;
    if (!tagNames.includes(name)) onChange([...tagNames, name]);
    setText("");
  }

  return (
    <Field label="Tags" htmlFor="tag-input">
      {tagNames.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {tagNames.map((tag) => (
            <li key={tag} className="inline-flex items-center rounded-sm bg-muted text-[13px] font-medium">
              <span className="pl-2.5">{tag}</span>
              <button
                type="button"
                onClick={() => onChange(tagNames.filter((name) => name !== tag))}
                aria-label={`Quitar tag ${tag}`}
                className="flex size-11 items-center justify-center text-muted-foreground hover:text-foreground md:size-8"
              >
                <X aria-hidden="true" className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <input
        id="tag-input"
        type="text"
        value={text}
        onChange={(event) => setText(event.target.value)}
        onBlur={addTyped}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            addTyped();
          }
        }}
        enterKeyHint="done"
        placeholder="warm up, peak time, vocal"
        maxLength={50}
        className={controlClass}
      />
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map(({ id, name }) => (
            <button
              key={id}
              type="button"
              onClick={() => onChange([...tagNames, name])}
              aria-label={`Agregar tag ${name}`}
              className={cn(CHIP, "bg-muted text-muted-foreground hover:text-foreground")}
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </Field>
  );
}

type CrateTagsProps = FolderFieldProps & {
  tagNames: string[];
  onTagsChange: (tagNames: string[]) => void;
};

export function CrateTags({ folderIds, onChange, tagNames, onTagsChange }: CrateTagsProps) {
  return (
    <FormSection title="Carpetas y tags">
      <FolderField folderIds={folderIds} onChange={onChange} />
      <TagField tagNames={tagNames} onChange={onTagsChange} />
    </FormSection>
  );
}
