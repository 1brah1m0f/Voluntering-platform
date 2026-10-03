import { ChevronDown } from 'lucide-react';
import { useLang } from '../i18n';
import { Reveal, SectionHeader } from './Section';

export default function FAQ() {
  const { t } = useLang();
  return (
    <section id="faq" aria-labelledby="faq-title" className="bg-gradient-to-b from-amber-50/70 via-white to-white py-20 sm:py-24">
      <div className="container-x">
        <SectionHeader id="faq-title" eyebrow={t.faq.eyebrow} title={t.faq.title} tone="amber" />
        <Reveal className="mx-auto mt-12 max-w-3xl space-y-3">
          {t.faq.items.map((item, i) => (
            <details key={item.q} className="group rounded-2xl border border-line border-l-4 bg-white px-5 py-1 shadow-sm transition open:border-l-amber-400 open:shadow-card hover:border-l-amber-300 sm:px-6" open={i === 0}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left text-base font-bold text-slate-900 sm:text-lg [&::-webkit-details-marker]:hidden">
                {item.q}
                <ChevronDown className="h-5 w-5 shrink-0 text-amber-600 transition group-open:rotate-180" aria-hidden="true" />
              </summary>
              <p className="pb-5 leading-7 text-slate-700">{item.a}</p>
            </details>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
