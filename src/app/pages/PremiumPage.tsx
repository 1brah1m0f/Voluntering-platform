import { useLang } from '../../i18n';
export default function FreeFeatures() {
  const { lang } = useLang();
  return <section className="rounded-3xl border border-line bg-white p-6 shadow-card">
    <h2 className="text-2xl font-bold">{lang === 'az' ? 'Hər şey pulsuzdur' : 'Everything is free'}</h2>
    <p className="mt-3 text-slate-600">{lang === 'az'
      ? 'Limitsiz izləmə, bütün filtrlər, ağıllı uyğunlaşdırma, gündəlik xülasə və son tarix xatırlatmaları hamı üçün açıqdır. AI köməkçi: gündə 10 istifadə.'
      : 'Unlimited tracking, all filters, smart matching, daily digests and deadline reminders are available to everyone. AI assistant: 10 uses per day.'}</p>
  </section>;
}
