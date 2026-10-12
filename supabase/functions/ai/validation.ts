import { STUDENT_ACTIONS } from './schema.ts';
export type Lang = 'az' | 'en';
export type Answer = { question: string; answer: string };
export type PdfFile = { name?: string; mimeType: 'application/pdf'; data: string };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const text = (v: unknown, max: number, min = 1): v is string => typeof v === 'string' && v.trim().length >= min && v.length <= max;

export function validate(body: Record<string, unknown>): string | null {
  if (body.lang !== undefined && body.lang !== 'az' && body.lang !== 'en') return 'bad language';
  if (STUDENT_ACTIONS.includes(body.action as string)) {
    const target = body.target as { kind?: unknown; id?: unknown } | null | undefined;
    if (target && (!['scholarship', 'university'].includes(target.kind as string) || typeof target.id !== 'string' || !UUID.test(target.id))) return 'bad target';
    if (body.action === 'student_fit' && !target) return 'target required';
    if (body.action === 'student_ask' && !text(body.question, 600)) return 'bad question';
    if (body.action === 'student_review' && !text(body.text, 12_000, 50)) return 'bad text';
    return null;
  }
  if (!['questions', 'draft', 'review'].includes(body.action as string)) return 'bad action';
  if (typeof body.opportunityId !== 'string' || !UUID.test(body.opportunityId)) return 'bad opportunityId';
  if (body.action === 'draft') {
    if (body.letterLang !== undefined && body.letterLang !== 'az' && body.letterLang !== 'en') return 'bad letter language';
    const answers = body.answers;
    if (!Array.isArray(answers) || !answers.length || answers.length > 8) return 'answers required';
    if (answers.some((a) => !a || !text(a.question, 600) || typeof a.answer !== 'string' || a.answer.length > 2000)) return 'bad answers';
    if (!answers.some((a) => a.answer.trim())) return 'answers empty';
  }
  if (body.action === 'review') {
    if (body.docType !== 'letter' && body.docType !== 'cv') return 'bad document type';
    const file = body.file as Partial<PdfFile> | null | undefined;
    if (file) {
      if (file.mimeType !== 'application/pdf' || typeof file.data !== 'string') return 'bad file';
      if (file.data.length > 4 * 1024 * 1024) return 'file too large';
      if (!file.data.startsWith('JVBERi') || !/^[A-Za-z0-9+/]+={0,2}$/.test(file.data) || file.data.length % 4 !== 0) return 'not a pdf';
    } else if (!text(body.text, 12_000, 50)) return 'bad text';
  }
  return null;
}
