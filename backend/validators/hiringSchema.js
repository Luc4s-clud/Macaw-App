import { z } from 'zod';

const trimStr = z.string().trim();
const optionalTrim = z.string().trim().max(2000).optional();

function boolField() {
  return z
    .string()
    .optional()
    .transform((v) => v === 'true' || v === 'on');
}

export const hiringApplicationSchema = z.object({
  firstName: trimStr.min(1, 'First name is required').max(120),
  lastName: trimStr.min(1, 'Last name is required').max(120),
  streetAddress: trimStr.min(1, 'Street address is required').max(200),
  streetAddress2: z.string().trim().max(200).optional(),
  city: trimStr.min(1, 'City is required').max(120),
  state: trimStr.min(1, 'State is required').max(80),
  zipCode: trimStr.min(1, 'Zip code is required').max(20),
  email: z.string().trim().email('Invalid email').max(120),
  phone: trimStr.min(5, 'Phone is required').max(40),
  position: z.enum(['server', 'prep', 'cashier', 'manager', 'other']),
  desiredSalary: trimStr.min(1, 'Desired salary is required').max(80),
  hoursDesired: z.string().trim().max(80).optional(),
  mondayAM: boolField(),
  mondayPM: boolField(),
  tuesdayAM: boolField(),
  tuesdayPM: boolField(),
  wednesdayAM: boolField(),
  wednesdayPM: boolField(),
  thursdayAM: boolField(),
  thursdayPM: boolField(),
  fridayAM: boolField(),
  fridayPM: boolField(),
  saturdayAM: boolField(),
  saturdayPM: boolField(),
  sundayAM: boolField(),
  sundayPM: boolField(),
  physicalRestrictions: optionalTrim,
  employer1Company: optionalTrim,
  employer1Phone: optionalTrim,
  employer1Start: optionalTrim,
  employer1End: optionalTrim,
  employer1Position: optionalTrim,
  employer1Contact: z.enum(['yes', 'no', '']).optional(),
  employer2Company: optionalTrim,
  employer2Phone: optionalTrim,
  employer2Start: optionalTrim,
  employer2End: optionalTrim,
  employer2Position: optionalTrim,
  employer2Contact: z.enum(['yes', 'no', '']).optional(),
});
