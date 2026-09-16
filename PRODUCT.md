# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Patients (and prospective patients) of a dermatology clinic ("Phòng Khám Da Liễu"),
browsing the clinic site in Vietnamese and self-booking their own appointments online.
Clinic staff also work in the same app, in a separate authenticated work area: admins
(`/quan-tri`), doctors (`/bac-si`), receptionist/cashiers (`/thu-ngan`) and pharmacists
(`/nha-thuoc`), all at a desk during clinic hours, repeating the same tasks many times a day.

## Product Purpose

A public dermatology clinic website that lets a visitor learn about the clinic (services,
doctors, facilities), then register/log in and book an appointment themselves: pick a
doctor, date/time, and service, confirm, and later view or manage their own upcoming
appointments and profile. Staff run the visit behind it: check-in, examination and
prescribing, settlement and payment, dispensing and stock, and clinic administration.

## Positioning

The differentiator is the convenience of booking entirely online, start to finish (choose
doctor → date/time → service → confirm), versus clinics that require a phone call or
walk-in to get an appointment.

## Operating Context

- Backend is a separate .NET API ("QLPK API"), consumed through `src/api/` (httpClient,
  helpers, url, types, session, and per-domain `functions/`, the only layer pages import).
- API responses use snake_case JSON and real HTTP status codes with ProblemDetails errors
  (no `{code,data}` envelope); an axios interceptor auto-refreshes the access token once on
  401 before failing the session.
- Booking and sensitive actions (register, resend code, forgot password, booking) require
  a Cloudflare Turnstile CAPTCHA, exchanged for a one-time verification token
  (`useCaptcha`); login only requires it after repeated failed attempts.
- Viewing open slots and creating a booking both require an authenticated session with
  `appointments.book_own`, so booking sits behind login (`AuthGuard`), unlike the public
  home/clinic-detail pages.
- An account with `must_change_password` set gets a token with no permissions and is
  routed to the forced password-change page (`/doi-mat-khau`) until resolved.
- Deployed to Azure Static Web Apps (`.env.production` always points at the Azure API).
  Both backend roots live in `.env`; `VITE_API_TARGET` picks one (`npm run dev` = Azure,
  `npm run dev:local` = localhost:5131), resolved in `src/api/apiTarget.ts`. See
  `docs/ket-noi-backend-va-deploy.md` for the full deploy/CORS/CAPTCHA runbook.

## Capabilities and Constraints

- Public pages: home (hero, services, doctors, facilities, about, testimonials, news,
  contact), clinic detail.
- Auth: login, register, forgot password, forced password change, session persisted via
  localStorage/sessionStorage.
- Booking: multi-step flow — doctor → date/time → service → patient info → confirm.
- Patient account area: "my appointments" and profile, both behind login.
- Staff work area (`src/staff/`, lazy-loaded): sidebar built from the account's permission
  codes (not role names), so an admin also sees the cashier and pharmacy sections. Screens
  cover every Admin/Doctor/Staff/Pharmacist endpoint of the API. The backend has no staff
  endpoint to list doctors or specialties; the desk derives doctors from appointments (or
  staff accounts for admins) and specialties come from `SpecialtySeed`.
- Terminology is Vietnamese throughout (route paths and UI text), matching the site's only
  language; no i18n/localization has been built.
- Undecided: no accessibility standard has been specified for this product.

## Evidence on Hand

Doctors, testimonials, and facilities content currently in the code are placeholder/sample
data — stock photos and invented quotes (e.g. `TestimonialsSection.tsx`'s
`defaultTestimonials`). Treat all of it as a content placeholder, not real evidence: future
work must not extend it, treat it as truth, or fabricate further placeholder "facts" (new
invented testimonials, doctor credentials, stats) beyond what already exists.

## Product Principles

- Booking is the product: every surface should make it obvious how to get from "browsing"
  to "an appointment is booked," since that's the entire value proposition over a
  phone-in clinic.
- Trust the backend's real constraints, don't paper over them: permission checks (e.g.
  `appointments.book_own`), CAPTCHA gates, and forced-password-change all reflect actual
  security/business rules, not UI opinions.
- Patient surfaces sell and book (Persuade); staff surfaces are Operate: dense tables,
  side sheets for forms, confirm dialogs only for irreversible steps, status badges from
  one shared vocabulary (`src/staff/labels.ts`), all under the `st-` CSS namespace.
- Content honesty: never let placeholder doctors/testimonials/facilities read as if they
  were confirmed real clinic facts.

## Accessibility & Inclusion

No product-specific accessibility requirement has been established yet.
