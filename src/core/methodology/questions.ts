import type { Tag } from './tags';
import { QUESTION_WEIGHTS, type QuestionId } from './weights';

export type OptionKey = 'A' | 'B' | 'C' | 'D';
export type WeightedTags = readonly [Tag, ...Tag[]];

export interface QuestionOptionDefinition {
  readonly text: string;
  readonly tags: WeightedTags;
}

export interface QuestionDefinition {
  readonly id: QuestionId;
  readonly text: string;
  readonly weight: number;
  readonly options: Record<OptionKey, QuestionOptionDefinition>;
}

export const QUESTIONS: readonly QuestionDefinition[] = [
  {
    id: 1,
    text: 'دخلت مدينة غريبة وحدك. أول شيء تلفتله؟',
    weight: QUESTION_WEIGHTS[1],
    options: {
      A: { text: 'الناس', tags: ['SOC', 'OBS'] },
      B: { text: 'المباني', tags: ['ANA', 'CTRL', 'PRAC'] },
      C: { text: 'الأصوات', tags: ['INT', 'OBS'] },
      D: { text: 'المخارج والاتجاهات', tags: ['SAF', 'CTRL', 'ANA'] }
    }
  },
  {
    id: 2,
    text: 'لو تلقى صندوق قديم مغلق:',
    weight: QUESTION_WEIGHTS[2],
    options: {
      A: { text: 'تفتحه فورًا', tags: ['EXP', 'RISK', 'ACT'] },
      B: { text: 'تراقبه أولًا', tags: ['OBS', 'ANA', 'SAF'] },
      C: { text: 'تتركه', tags: ['AVD', 'SAF', 'IND'] },
      D: { text: 'تبحث لمن يخص', tags: ['RESP', 'SOC', 'ANA'] }
    }
  },
  {
    id: 3,
    text: 'أي طريق تختار؟',
    weight: QUESTION_WEIGHTS[3],
    options: {
      A: { text: 'قصير وخطير', tags: ['RISK', 'ACT', 'EXP'] },
      B: { text: 'طويل وآمن', tags: ['SAF', 'PRAC', 'CTRL'] },
      C: { text: 'مجهول لكنه جميل', tags: ['EXP', 'INT', 'MEAN'] },
      D: { text: 'طريق الناس الكل ماشية فيه', tags: ['ADAPT', 'SAF', 'SOC'] }
    }
  },
  {
    id: 4,
    text: 'لو عندك ساعة فراغ:',
    weight: QUESTION_WEIGHTS[4],
    options: {
      A: { text: 'تتعلم شيء', tags: ['ANA', 'MEAN', 'CTRL'] },
      B: { text: 'ترتاح', tags: ['PRAC', 'CALM', 'SAF'] },
      C: { text: 'تتواصل مع شخص', tags: ['SOC', 'COOP'] },
      D: { text: 'تخرج تستكشف', tags: ['EXP', 'ACT'] }
    }
  },
  {
    id: 5,
    text: 'أي حيوان أقرب لك؟',
    weight: QUESTION_WEIGHTS[5],
    options: {
      A: { text: 'ذئب', tags: ['IND', 'LEAD', 'RISK'] },
      B: { text: 'قط', tags: ['IND', 'OBS', 'AVD'] },
      C: { text: 'حصان', tags: ['COOP', 'SOC', 'RESP'] },
      D: { text: 'بومة', tags: ['OBS', 'ANA', 'MEAN'] }
    }
  },
  {
    id: 6,
    text: 'في لعبة جماعية:',
    weight: QUESTION_WEIGHTS[6],
    options: {
      A: { text: 'القائد', tags: ['LEAD', 'ACT', 'CTRL'] },
      B: { text: 'المخطط', tags: ['ANA', 'CTRL', 'OBS'] },
      C: { text: 'المنفذ', tags: ['COOP', 'ACT', 'RESP', 'PRAC'] },
      D: { text: 'المراقب', tags: ['OBS', 'IND', 'ANA'] }
    }
  },
  {
    id: 7,
    text: 'إذا ضعت في غابة:',
    weight: QUESTION_WEIGHTS[7],
    options: {
      A: { text: 'تتبع اتجاه ثابت', tags: ['CTRL', 'ACT', 'SAF'] },
      B: { text: 'تطلع لمكان مرتفع', tags: ['ANA', 'OBS', 'SAF'] },
      C: { text: 'تبقى مكانك', tags: ['SAF', 'WAIT', 'AVD'] },
      D: { text: 'تجرب طرق مختلفة', tags: ['EXP', 'RISK', 'ACT'] }
    }
  },
  {
    id: 8,
    text: 'أكثر مكان يريحك؟',
    weight: QUESTION_WEIGHTS[8],
    options: {
      A: { text: 'بحر', tags: ['CALM', 'EXP', 'MEAN'] },
      B: { text: 'مدينة ليلًا', tags: ['INT', 'OBS', 'SOC'] },
      C: { text: 'جبل', tags: ['IND', 'MEAN', 'SAF'] },
      D: { text: 'غرفة هادئة', tags: ['IND', 'CALM', 'AVD'] }
    }
  },
  {
    id: 9,
    text: 'لو عندك مفتاح غامض:',
    weight: QUESTION_WEIGHTS[9],
    options: {
      A: { text: 'تجرب كل الأبواب', tags: ['EXP', 'ACT', 'RISK'] },
      B: { text: 'تخزنه', tags: ['SAF', 'CTRL', 'WAIT'] },
      C: { text: 'تبحث عن قصته', tags: ['ANA', 'MEAN', 'OBS'] },
      D: { text: 'تعطيه لغيرك', tags: ['RESP', 'COOP', 'AVD'] }
    }
  },
  {
    id: 10,
    text: 'في فيلم، أكثر شخصية تعجبك؟',
    weight: QUESTION_WEIGHTS[10],
    options: {
      A: { text: 'البطل', tags: ['LEAD', 'ACT', 'RESP'] },
      B: { text: 'الذكي الهادئ', tags: ['ANA', 'OBS', 'CTRL'] },
      C: { text: 'الشرير المعقد', tags: ['INT', 'ANA', 'MEAN'] },
      D: { text: 'الشخصية المضحكة', tags: ['SOC', 'CALM', 'PRAC'] }
    }
  },
  {
    id: 11,
    text: 'لو انقطعت الكهرباء:',
    weight: QUESTION_WEIGHTS[11],
    options: {
      A: { text: 'تتصرف بسرعة', tags: ['ACT', 'CTRL', 'RESP'] },
      B: { text: 'تنتظر', tags: ['WAIT', 'SAF', 'CALM'] },
      C: { text: 'تقلق', tags: ['ANX', 'SAF', 'AVD'] },
      D: { text: 'تستمتع بالهدوء', tags: ['CALM', 'IND', 'MEAN'] }
    }
  },
  {
    id: 12,
    text: 'أي عنصر تختار؟',
    weight: QUESTION_WEIGHTS[12],
    options: {
      A: { text: 'نار', tags: ['ACT', 'RISK', 'LEAD'] },
      B: { text: 'ماء', tags: ['CALM', 'ADAPT', 'INT'] },
      C: { text: 'هواء', tags: ['EXP', 'IND', 'INT'] },
      D: { text: 'أرض', tags: ['SAF', 'CTRL', 'PRAC'] }
    }
  },
  {
    id: 13,
    text: 'لو كنت كتاب:',
    weight: QUESTION_WEIGHTS[13],
    options: {
      A: { text: 'فلسفة', tags: ['MEAN', 'ANA'] },
      B: { text: 'مغامرة', tags: ['EXP', 'RISK', 'ACT'] },
      C: { text: 'غموض', tags: ['INT', 'OBS', 'ANA'] },
      D: { text: 'سيرة ذاتية', tags: ['MEAN', 'SOC', 'PRAC'] }
    }
  },
  {
    id: 14,
    text: 'أكثر شيء يزعجك في رحلة؟',
    weight: QUESTION_WEIGHTS[14],
    options: {
      A: { text: 'الفوضى', tags: ['CTRL', 'SAF', 'ANA'] },
      B: { text: 'التأخير', tags: ['CTRL', 'PRAC', 'ANX'] },
      C: { text: 'الملل', tags: ['EXP', 'ACT'] },
      D: { text: 'كثرة الناس', tags: ['IND', 'AVD', 'SAF'] }
    }
  },
  {
    id: 15,
    text: 'لو أعطوك جزيرة:',
    weight: QUESTION_WEIGHTS[15],
    options: {
      A: { text: 'تبني نظام', tags: ['CTRL', 'LEAD', 'PRAC'] },
      B: { text: 'تستكشفها', tags: ['EXP', 'ACT', 'RISK'] },
      C: { text: 'تدعو ناس', tags: ['SOC', 'COOP', 'LEAD'] },
      D: { text: 'تعيش وحدك', tags: ['IND', 'CALM', 'AVD'] }
    }
  },
  {
    id: 16,
    text: 'لو تسمع صوت غريب بالليل:',
    weight: QUESTION_WEIGHTS[16],
    options: {
      A: { text: 'تروح تشوف', tags: ['ACT', 'RISK', 'EXP'] },
      B: { text: 'تتجاهل', tags: ['AVD', 'CALM', 'SAF'] },
      C: { text: 'تحذر غيرك', tags: ['RESP', 'SOC', 'SAF'] },
      D: { text: 'تراقب بصمت', tags: ['OBS', 'ANA', 'SAF'] }
    }
  },
  {
    id: 17,
    text: 'أي لون تختار؟',
    weight: QUESTION_WEIGHTS[17],
    options: {
      A: { text: 'أسود', tags: ['INT', 'IND', 'MEAN'] },
      B: { text: 'أزرق', tags: ['CALM', 'MEAN', 'SAF'] },
      C: { text: 'أحمر', tags: ['ACT', 'RISK', 'LEAD', 'REC'] },
      D: { text: 'أخضر', tags: ['CALM', 'PRAC', 'MEAN'] }
    }
  },
  {
    id: 18,
    text: 'لو تربح مسابقة:',
    weight: QUESTION_WEIGHTS[18],
    options: {
      A: { text: 'تفرح بالفوز', tags: ['REC', 'LEAD', 'ACT'] },
      B: { text: 'تهتم بالجائزة', tags: ['PRAC', 'CTRL'] },
      C: { text: 'تحب الاعتراف', tags: ['REC', 'SOC'] },
      D: { text: 'تنسى بسرعة', tags: ['IND', 'CALM', 'AVD'] }
    }
  },
  {
    id: 19,
    text: 'أي قوة خارقة؟',
    weight: QUESTION_WEIGHTS[19],
    options: {
      A: { text: 'قراءة الأفكار', tags: ['OBS', 'SOC', 'CTRL', 'ANA'] },
      B: { text: 'الاختفاء', tags: ['IND', 'AVD', 'SAF', 'OBS'] },
      C: { text: 'إيقاف الزمن', tags: ['CTRL', 'ANA', 'SAF', 'MEAN'] },
      D: { text: 'التنبؤ', tags: ['SAF', 'CTRL', 'ANA', 'OBS'] }
    }
  },
  {
    id: 20,
    text: 'باب أمامك مكتوب عليه:',
    weight: QUESTION_WEIGHTS[20],
    options: {
      A: { text: 'الحقيقة', tags: ['MEAN', 'ANA', 'CTRL'] },
      B: { text: 'القوة', tags: ['CTRL', 'LEAD', 'REC'] },
      C: { text: 'الحب', tags: ['SOC', 'COOP', 'MEAN'] },
      D: { text: 'المعرفة', tags: ['MEAN', 'ANA', 'CTRL'] }
    }
  }
] as const;

export const QUESTION_BY_ID: Record<QuestionId, QuestionDefinition> = Object.fromEntries(
  QUESTIONS.map((question) => [question.id, question])
) as Record<QuestionId, QuestionDefinition>;

export const OPTION_KEYS: readonly OptionKey[] = ['A', 'B', 'C', 'D'] as const;

export function getQuestion(questionId: QuestionId): QuestionDefinition {
  return QUESTION_BY_ID[questionId];
}
