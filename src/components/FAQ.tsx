import { ChevronDown } from 'lucide-react';
import { useLang } from '../i18n';
import { Reveal, SectionHeader } from './Section';

export default function FAQ() {
  const { t } = useLang();
  return (
    <section aria-labelledby="faq-title" className="bg-slate-50 py-20 sm:py-24">
      <div className="container-x">
        <SectionHeader id="faq-title" eyebrow={t.faq.eyebrow} title={t.faq.title} />
        <Reveal className="mx-auto mt-12 max-w-3xl space-y-3">
          {t.faq.items.map((item, i) => (
            <details key={item.q} className="group rounded-2xl border border-slate-200 bg-white px-6 py-1 shadow-card open:shadow-soft" open={i === 0}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left font-bold text-slate-900 [&::-webkit-details-marker]:hidden">
                {item.q}
                <ChevronDown className="h-5 w-5 shrink-0 text-brand-600 transition group-open:rotate-180" aria-hidden="true" />
              </summary>
              <p className="pb-5 leading-relaxed text-slate-600">{item.a}</p>
            </details>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
