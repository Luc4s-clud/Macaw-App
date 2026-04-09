import { useState } from 'react';

function HiringPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    streetAddress: '',
    streetAddress2: '',
    city: '',
    state: '',
    zipCode: '',
    email: '',
    phone: '',
    position: '',
    desiredSalary: '',
    hoursDesired: '',
    mondayAM: false,
    mondayPM: false,
    tuesdayAM: false,
    tuesdayPM: false,
    wednesdayAM: false,
    wednesdayPM: false,
    thursdayAM: false,
    thursdayPM: false,
    fridayAM: false,
    fridayPM: false,
    saturdayAM: false,
    saturdayPM: false,
    sundayAM: false,
    sundayPM: false,
    physicalRestrictions: '',
    employer1Company: '',
    employer1Phone: '',
    employer1Start: '',
    employer1End: '',
    employer1Position: '',
    employer1Contact: '',
    employer2Company: '',
    employer2Phone: '',
    employer2Start: '',
    employer2End: '',
    employer2Position: '',
    employer2Contact: '',
  });

  const update = (key: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const inputClass =
    'w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary';
  const labelClass = 'block text-slate-700 text-sm font-medium mb-1';
  const sectionTitle = 'font-display text-lg font-semibold text-primary mb-4';

  return (
    <>
      {/* Hero — Hiring.jpg with "Hiring" title */}
      <section className="relative min-h-[320px] md:min-h-[400px] flex items-center justify-center overflow-hidden">
        <img
          src="/pictures/Hiring.jpg"
          alt="Join our team - Macaw Açaíteria"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-primary/60" />
        <h1 className="relative font-display text-5xl md:text-7xl font-bold text-white uppercase tracking-tight">
          Hiring
        </h1>
      </section>

      {/* Beige section — Join Our Team + form */}
      <section className="bg-amber-50/95 relative overflow-hidden py-12 md:py-16">
        <div
          className="absolute inset-0 opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 10 Q40 5 60 20 Q75 40 60 60 Q40 75 20 60 Q5 40 20 10z' fill='%236d28d9' fill-opacity='0.5'/%3E%3Cpath d='M40 15 L45 35 L65 40 L45 45 L40 65 L35 45 L15 40 L35 35 Z' fill='%236d28d9' fill-opacity='0.3'/%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-6 md:p-10">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-primary mb-2 text-center">
              Join Our Team
            </h2>
            <p className="text-slate-600 text-center mb-8">
              Upload your resume and we will get back to you as soon as possible.
            </p>
            <hr className="border-slate-200 mb-8" />

            {/* Contact Info */}
            <h3 className={sectionTitle}>Contact Info</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className={labelClass}>First Name (Required)</label>
                <input
                  type="text"
                  className={inputClass}
                  value={formData.firstName}
                  onChange={(e) => update('firstName', e.target.value)}
                  placeholder="First Name"
                />
              </div>
              <div>
                <label className={labelClass}>Last Name (Required)</label>
                <input
                  type="text"
                  className={inputClass}
                  value={formData.lastName}
                  onChange={(e) => update('lastName', e.target.value)}
                  placeholder="Last Name"
                />
              </div>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className={labelClass}>Street Address (Required)</label>
                <input
                  type="text"
                  className={inputClass}
                  value={formData.streetAddress}
                  onChange={(e) => update('streetAddress', e.target.value)}
                  placeholder="Street Address"
                />
              </div>
              <div>
                <label className={labelClass}>Street Address Line 2</label>
                <input
                  type="text"
                  className={inputClass}
                  value={formData.streetAddress2}
                  onChange={(e) => update('streetAddress2', e.target.value)}
                  placeholder="Apt, suite, etc."
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>City (Required)</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={formData.city}
                    onChange={(e) => update('city', e.target.value)}
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className={labelClass}>State (Required)</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={formData.state}
                    onChange={(e) => update('state', e.target.value)}
                    placeholder="State"
                  />
                </div>
                <div>
                  <label className={labelClass}>Zip Code (Required)</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={formData.zipCode}
                    onChange={(e) => update('zipCode', e.target.value)}
                    placeholder="Zip Code"
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Email Address (Required)</label>
                <input
                  type="email"
                  className={inputClass}
                  value={formData.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="Email"
                />
              </div>
              <div>
                <label className={labelClass}>Phone Number (Required)</label>
                <input
                  type="tel"
                  className={inputClass}
                  value={formData.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  placeholder="000-000-0000 or (000) 000-0000"
                />
              </div>
            </div>

            {/* Job Details */}
            <h3 className={sectionTitle}>Job Details</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className={labelClass}>What Position Are You Applying For? (Required)</label>
                <select
                  className={inputClass}
                  value={formData.position}
                  onChange={(e) => update('position', e.target.value)}
                >
                  <option value="">Select an option</option>
                  <option value="server">Server</option>
                  <option value="prep">Prep</option>
                  <option value="cashier">Cashier</option>
                  <option value="manager">Manager</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Desired Salary (Required)</label>
                <input
                  type="text"
                  className={inputClass}
                  value={formData.desiredSalary}
                  onChange={(e) => update('desiredSalary', e.target.value)}
                  placeholder="Desired Salary"
                />
              </div>
            </div>

            {/* Availability */}
            <h3 className={sectionTitle}>Availability</h3>
            <div className="mb-4">
              <label className={labelClass}>Number of Hours Desired</label>
              <input
                type="text"
                className={inputClass}
                value={formData.hoursDesired}
                onChange={(e) => update('hoursDesired', e.target.value)}
                placeholder="Hours per week"
              />
            </div>
            <div className="space-y-4 mb-6">
              {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const).map((day) => (
                <div key={day}>
                  <p className="text-slate-700 font-medium mb-2 capitalize">
                    {day} Availability (select all that apply)
                  </p>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData[`${day}AM` as keyof typeof formData] as boolean}
                        onChange={(e) => update(`${day}AM`, e.target.checked)}
                        className="rounded border-slate-300 text-primary focus:ring-primary"
                      />
                      <span>AM</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData[`${day}PM` as keyof typeof formData] as boolean}
                        onChange={(e) => update(`${day}PM`, e.target.checked)}
                        className="rounded border-slate-300 text-primary focus:ring-primary"
                      />
                      <span>PM</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>

            {/* Physical Restrictions */}
            <div className="mb-6">
              <label className={labelClass}>Physical Restrictions (i.e. heavy lifting)</label>
              <textarea
                className={`${inputClass} min-h-[80px]`}
                value={formData.physicalRestrictions}
                onChange={(e) => update('physicalRestrictions', e.target.value)}
                placeholder="Describe any physical restrictions"
                rows={3}
              />
            </div>

            {/* Employment History */}
            <h3 className={sectionTitle}>Employment History</h3>
            {([1, 2] as const).map((n) => (
              <div key={n} className="mb-8">
                <p className="font-display font-semibold text-primary mb-3">Employer {n}</p>
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Company Name</label>
                    <input
                      type="text"
                      className={inputClass}
                      value={formData[`employer${n}Company` as keyof typeof formData] as string}
                      onChange={(e) => update(`employer${n}Company`, e.target.value)}
                      placeholder="Company Name"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Employer Phone</label>
                    <input
                      type="tel"
                      className={inputClass}
                      value={formData[`employer${n}Phone` as keyof typeof formData] as string}
                      onChange={(e) => update(`employer${n}Phone`, e.target.value)}
                      placeholder="Employer Phone"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Start Date</label>
                      <input
                        type="text"
                        className={inputClass}
                        value={formData[`employer${n}Start` as keyof typeof formData] as string}
                        onChange={(e) => update(`employer${n}Start`, e.target.value)}
                        placeholder="dd/mm/yyyy"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>End Date</label>
                      <input
                        type="text"
                        className={inputClass}
                        value={formData[`employer${n}End` as keyof typeof formData] as string}
                        onChange={(e) => update(`employer${n}End`, e.target.value)}
                        placeholder="dd/mm/yyyy"
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Position</label>
                    <input
                      type="text"
                      className={inputClass}
                      value={formData[`employer${n}Position` as keyof typeof formData] as string}
                      onChange={(e) => update(`employer${n}Position`, e.target.value)}
                      placeholder="Position"
                    />
                  </div>
                  <div>
                    <p className="text-slate-700 text-sm mb-2">May we contact?</p>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`employer${n}Contact`}
                          checked={(formData[`employer${n}Contact` as keyof typeof formData] as string) === 'yes'}
                          onChange={() => update(`employer${n}Contact`, 'yes')}
                          className="text-primary focus:ring-primary"
                        />
                        <span>Yes</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`employer${n}Contact`}
                          checked={(formData[`employer${n}Contact` as keyof typeof formData] as string) === 'no'}
                          onChange={() => update(`employer${n}Contact`, 'no')}
                          className="text-primary focus:ring-primary"
                        />
                        <span>No</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Resume Upload */}
            <div className="mb-6">
              <label className={labelClass}>
                Upload Your Resume (pdf, doc, docx, jpg, jpeg):
              </label>
              <input
                type="file"
                className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-primary file:text-white file:font-medium hover:file:bg-primaryDark"
                accept=".pdf,.doc,.docx,.jpg,.jpeg"
              />
            </div>

            <button
              type="button"
              className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primaryDark transition-colors uppercase tracking-wide"
            >
              Submit
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

export default HiringPage;
