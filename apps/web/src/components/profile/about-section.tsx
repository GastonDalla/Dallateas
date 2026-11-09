import { Field, FormSection, TextAreaField } from "./fields";
import type { ProfileErrors, ProfileForm } from "./profile-form";

type AboutSectionProps = {
  form: ProfileForm;
  update: (changes: Partial<ProfileForm>) => void;
  errors: ProfileErrors;
};

export function AboutSection({ form, update, errors }: AboutSectionProps) {
  return (
    <FormSection title="Sobre vos" description="Quién sos, dónde tocás y qué pasás">
      <TextAreaField
        id="dj-bio"
        label="Bio"
        placeholder="Contale al mundo sobre vos como DJ"
        maxLength={1000}
        rows={4}
        value={form.bio}
        onChange={(event) => update({ bio: event.target.value })}
        hint={<span className="tabular">{form.bio.length}/1000</span>}
      />
      <Field
        id="dj-location"
        label="Ubicación"
        optional
        placeholder="Buenos Aires, Argentina"
        maxLength={200}
        value={form.location}
        onChange={(event) => update({ location: event.target.value })}
      />
      <Field
        id="dj-genres"
        label="Géneros que mezclás"
        optional
        placeholder="Techno, House, Minimal, Acid"
        maxLength={500}
        value={form.genres}
        onChange={(event) => update({ genres: event.target.value })}
        hint="Separados por coma"
      />
      <Field
        id="dj-website"
        label="Sitio web"
        optional
        type="url"
        inputMode="url"
        placeholder="https://"
        maxLength={500}
        value={form.websiteUrl}
        onChange={(event) => update({ websiteUrl: event.target.value })}
        error={errors.websiteUrl}
      />
    </FormSection>
  );
}
