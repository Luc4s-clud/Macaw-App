import { useState } from 'react';

function ContactPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    comments: '',
  });

  const update = (key: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const inputClass =
    'w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary';
  const labelClass = 'block text-slate-700 text-sm font-medium mb-1';

  return (
    <>
      {/* Hero — Contact.jpg with "Contact" title */}
      <section className="relative min-h-[320px] md:min-h-[400px] flex items-center justify-center overflow-hidden">
        <img
          src="/pictures/Contact.jpg"
          alt="Açaí bowls - Contact Macaw Açaíteria"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/45" />
        <h1 className="relative font-display text-5xl md:text-7xl font-bold text-white uppercase tracking-tight">
          Contact
        </h1>
      </section>

      {/* Get In Touch form */}
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
              Get In Touch
            </h2>
            <p className="text-slate-600 text-center mb-8">
              We will get back to you as soon as possible!
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className={labelClass}>First Name (Required)</label>
                <input
                  type="text"
                  className={inputClass}
                  value={formData.firstName}
                  onChange={(e) => update('firstName', e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Last Name (Required)</label>
                <input
                  type="text"
                  className={inputClass}
                  value={formData.lastName}
                  onChange={(e) => update('lastName', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className={labelClass}>Email Address (Required)</label>
                <input
                  type="email"
                  className={inputClass}
                  value={formData.email}
                  onChange={(e) => update('email', e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Phone Number</label>
                <input
                  type="tel"
                  className={inputClass}
                  value={formData.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  placeholder="000-000-0000 or (000) 000-0000"
                />
              </div>
              <div>
                <label className={labelClass}>Comments</label>
                <textarea
                  className={`${inputClass} min-h-[120px]`}
                  value={formData.comments}
                  onChange={(e) => update('comments', e.target.value)}
                />
              </div>
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

      {/* Our Location */}
      <section className="bg-amber-50/98 border-t border-amber-200/80">
        <div className="max-w-5xl mx-auto px-4 py-10 md:py-14">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-primary text-center mb-8">
            Our Location
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start mb-8">
            <div>
              <h3 className="font-display text-lg font-semibold text-slate-900 mb-2">
                Macaw Açaíteria
              </h3>
              <p className="text-slate-700 text-sm leading-relaxed">
                2145 Roswell Rd Suite 110
                <br />
                Marietta, GA 30062
              </p>
              <p className="mt-3 text-sm">
                <a
                  href="tel:+14709134408"
                  className="text-primary font-medium hover:underline"
                >
                  (470) 913-4408
                </a>
              </p>
              <div className="mt-4 space-y-1 text-sm text-slate-700">
                <p className="font-semibold">Hours</p>
                <p>
                  <span className="font-medium">Monday:</span> 10:00 am - 10:00 pm
                </p>
                <p>
                  <span className="font-medium">Tuesday:</span> Closed
                </p>
                <p>
                  <span className="font-medium">Wednesday - Sunday:</span> 10:00 am - 10:00 pm
                </p>
              </div>
            </div>
            <div className="rounded-lg overflow-hidden shadow-md min-h-[260px] bg-slate-200">
              <iframe
                title="Macaw Açaíteria location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3314.77413448604!2d-84.493269!3d33.954571!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x88f515b18b79c8af%3A0x9c4f0e9e7f9de8bf!2s2145%20Roswell%20Rd%20%23110%2C%20Marietta%2C%20GA%2030062%2C%20USA!5e0!3m2!1sen!2sbr!4v1710000000000"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default ContactPage;

