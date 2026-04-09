import { useState } from 'react';

const sampleEvents = [
  {
    id: '1',
    date: 'MAR 14',
    title: 'Sample Event',
    time: 'Weekly Sat at 11:00 am - 3:00 pm',
    description:
      'Become the acai artist of your dreams! Choose from over 40 wild and wonderful toppings—from dragonfruit pearls to edible glitter. Kids under 10 bowl free with a paying adult. Plus live music and giveaways.',
  },
];

function EventsPage() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'calendar'>('upcoming');

  return (
    <>
      {/* Hero — Events & Specials image + title */}
      <section className="relative min-h-[320px] md:min-h-[400px] flex items-center justify-center overflow-hidden">
        <img
          src="/pictures/events-specials.jpg"
          alt="Events & Specials - Macaw Açaíteria"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-primary/55" />
        <h1 className="relative font-display text-4xl md:text-6xl font-bold text-white text-center uppercase tracking-tight px-4">
          Events & Specials
        </h1>
      </section>

      {/* Content — tabs + event cards */}
      <section className="bg-amber-50/95 relative overflow-hidden py-10 md:py-14">
        <div
          className="absolute inset-0 opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 10 Q40 5 60 20 Q75 40 60 60 Q40 75 20 60 Q5 40 20 10z' fill='%236d28d9' fill-opacity='0.5'/%3E%3Cpath d='M40 15 L45 35 L65 40 L45 45 L40 65 L35 45 L15 40 L35 35 Z' fill='%236d28d9' fill-opacity='0.3'/%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative max-w-3xl mx-auto px-4">
          {/* Tabs */}
          <div className="flex justify-end gap-0 mb-8">
            <button
              type="button"
              onClick={() => setActiveTab('upcoming')}
              className={`px-4 py-2 text-sm font-medium border rounded-l-lg transition-colors ${
                activeTab === 'upcoming'
                  ? 'bg-slate-100 border-primary text-primary border-r-0'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Upcoming Events
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('calendar')}
              className={`px-4 py-2 text-sm font-medium border rounded-r-lg transition-colors ${
                activeTab === 'calendar'
                  ? 'bg-slate-100 border-primary text-primary border-l-0'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Calendar
            </button>
          </div>

          {activeTab === 'upcoming' && (
            <div className="space-y-6">
              {sampleEvents.map((event) => (
                <article
                  key={event.id}
                  className="bg-white rounded-lg border-2 border-primary/20 overflow-hidden shadow-sm"
                >
                  <div className="bg-primary text-white px-4 py-2 font-display font-bold text-sm">
                    {event.date}
                  </div>
                  <div className="p-4 md:p-6">
                    <h2 className="font-display text-xl md:text-2xl font-bold text-primary mb-1">
                      {event.title}
                    </h2>
                    <p className="text-slate-600 text-sm mb-3">{event.time}</p>
                    <p className="text-slate-700 text-sm leading-relaxed">
                      {event.description}
                    </p>
                  </div>
                </article>
              ))}
              {sampleEvents.length === 0 && (
                <p className="text-center text-slate-500 py-8">
                  No upcoming events at the moment. Check back soon!
                </p>
              )}
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="bg-white rounded-lg border-2 border-primary/20 p-8 text-center text-slate-600">
              <p>Calendar view coming soon.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export default EventsPage;
