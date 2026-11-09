import { Field, FormSection } from "./fields";
import type { ProfileErrors, ProfileForm } from "./profile-form";

type BookingSectionProps = {
  form: ProfileForm;
  update: (changes: Partial<ProfileForm>) => void;
  errors: ProfileErrors;
};

export function BookingSection({ form, update, errors }: BookingSectionProps) {
  return (
    <FormSection title="Booking y prensa" description="Para que te puedan contratar. Se muestra en tu perfil público">
      <Field
        id="dj-booking-email"
        label="Email de booking"
        optional
        type="email"
        inputMode="email"
        placeholder="booking@tumail.com"
        maxLength={200}
        value={form.bookingEmail}
        onChange={(event) => update({ bookingEmail: event.target.value })}
        error={errors.bookingEmail}
      />
      <Field
        id="dj-booking-phone"
        label="Teléfono"
        optional
        type="tel"
        placeholder="+54 11 1234-5678"
        maxLength={50}
        value={form.bookingPhone}
        onChange={(event) => update({ bookingPhone: event.target.value })}
      />
      <Field
        id="dj-booking-info"
        label="Info adicional"
        optional
        placeholder="Manager, disponibilidad"
        maxLength={500}
        value={form.bookingInfo}
        onChange={(event) => update({ bookingInfo: event.target.value })}
      />
      <Field
        id="dj-press-kit"
        label="Press kit"
        optional
        type="url"
        inputMode="url"
        placeholder="https://drive.google.com/"
        maxLength={500}
        value={form.pressKitUrl}
        onChange={(event) => update({ pressKitUrl: event.target.value })}
        hint="Un link a tus fotos, rider y bio larga"
        error={errors.pressKitUrl}
      />
    </FormSection>
  );
}
