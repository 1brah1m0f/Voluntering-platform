const str = { type: "STRING" };
const strList = { type: "ARRAY", items: str };

export const SCHEMAS = {
  questions: {
    type: "OBJECT",
    properties: {
      questions: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: { question: str, why: str },
          required: ["question", "why"],
        },
      },
    },
    required: ["questions"],
  },
  draft: {
    type: "OBJECT",
    properties: { draft: str, tips: strList, missing_info: strList },
    required: ["draft", "tips", "missing_info"],
  },
  student_plan: {
    type: "OBJECT",
    properties: {
      summary: str,
      scholarships: { type: "ARRAY", items: { type: "OBJECT", properties: { id: str, why: str }, required: ["id", "why"] } },
      universities: { type: "ARRAY", items: { type: "OBJECT", properties: { id: str, why: str }, required: ["id", "why"] } },
      next_steps: { type: "ARRAY", items: { type: "OBJECT", properties: { when: str, action: str }, required: ["when", "action"] } },
      risks: strList,
    },
    required: ["summary", "scholarships", "universities", "next_steps", "risks"],
  },
  student_ask: {
    type: "OBJECT",
    properties: {
      answer: str,
      related: {
        type: "ARRAY",
        items: { type: "OBJECT", properties: { kind: { type: "STRING", enum: ["scholarship", "university"] }, id: str }, required: ["kind", "id"] },
      },
      follow_up: strList,
    },
    required: ["answer", "related", "follow_up"],
  },
  student_fit: {
    type: "OBJECT",
    properties: {
      verdict: { type: "STRING", enum: ["likely", "maybe", "unlikely"] },
      summary: str,
      reasons: strList,
      prepare: strList,
      check: strList,
    },
    required: ["verdict", "summary", "reasons", "prepare", "check"],
  },
  review: {
    type: "OBJECT",
    properties: {
      score: { type: "INTEGER" },
      verdict: str,
      strengths: strList,
      issues: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: { quote: str, problem: str, suggestion: str },
          required: ["quote", "problem", "suggestion"],
        },
      },
      missing: strList,
    },
    required: ["score", "verdict", "strengths", "issues", "missing"],
  },
} as const;

// student_review returns the same shape as review.
export type Action = keyof typeof SCHEMAS | "student_review";
export const schemaFor = (action: Action) => SCHEMAS[action === "student_review" ? "review" : action];
export const STUDENT_ACTIONS = ["student_plan", "student_ask", "student_fit", "student_review"];

