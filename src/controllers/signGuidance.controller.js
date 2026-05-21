const { GoogleGenerativeAI } = require("@google/generative-ai");
const Word = require("../models/Word");
const {
  Gioi_tu,
  Lien_tu,
  Tu_tinhthai,
  Tro_tu,
} = require("./typeWord.controller");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const GEMINI_MODELS = [
  "gemini-3.1-flash-lite", // 500 RPD - ưu tiên nhất
  "gemini-2.5-flash", // 20 RPD
  "gemini-2.5-flash-lite", // 20 RPD
  "gemini-3.5-flash", // 20 RPD
  "gemini-3.0-flash", // 20 RPD
];

const ALL_STOP_WORDS = [...Gioi_tu, ...Lien_tu, ...Tu_tinhthai, ...Tro_tu]
  .map((w) => w.toLowerCase())
  .sort(
    (a, b) => b.split(" ").length - a.split(" ").length || b.length - a.length,
  );

const MAX_PHRASE_LEN = Math.max(
  ...ALL_STOP_WORDS.map((w) => w.split(" ").length),
);

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractContentWords(sentence) {
  const normalized = sentence
    .toLowerCase()
    .replace(/[.,!?;:"""''()[\]{}…–—]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const tokens = normalized.split(" ").filter(Boolean);
  const contentWords = [];
  const removedWords = [];

  let i = 0;
  while (i < tokens.length) {
    let matched = false;
    for (
      let len = Math.min(MAX_PHRASE_LEN, tokens.length - i);
      len >= 1;
      len--
    ) {
      const phrase = tokens.slice(i, i + len).join(" ");
      if (ALL_STOP_WORDS.includes(phrase)) {
        removedWords.push(phrase);
        i += len;
        matched = true;
        break;
      }
    }
    if (!matched) {
      contentWords.push(tokens[i]);
      i++;
    }
  }

  return { contentWords, removedWords };
}

async function reorderWithGemini(contentWords) {
  if (contentWords.length <= 1) return contentWords;

  const prompt = `Bạn là chuyên gia ngôn ngữ ký hiệu tiếng Việt.
Nhận mảng từ tiếng Việt đã được lọc sẵn, sắp xếp lại theo cấu trúc ngôn ngữ ký hiệu.

Quy tắc sắp xếp:
1. Đại từ nhân xưng (tôi, bạn, anh, chị...) → đứng đầu
2. Danh từ / đối tượng → đứng tiếp theo
3. Số lượng → đứng ngay sau danh từ liên quan
4. Tính từ mô tả → đứng sau danh từ nó bổ nghĩa
5. Động từ / hành động → đứng cuối

Có thể gộp các từ liên quan thành cụm (ví dụ: "thùng" + "sữa" → "thùng sữa").
Chỉ trả về JSON array, KHÔNG có markdown, KHÔNG giải thích.

Ví dụ input: ["tôi", "mua", "1", "thùng", "sữa"]
Ví dụ output: ["tôi", "thùng sữa", "1", "mua"]

Input: ${JSON.stringify(contentWords)}`;

  for (const modelName of GEMINI_MODELS) {
    try {
      console.log(`Đang thử model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const raw = result.response.text().trim();

      const cleaned = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      if (Array.isArray(parsed)) {
        console.log(`Thành công với model: ${modelName}`);
        return parsed;
      }
    } catch (err) {
      const isQuotaError =
        err.message?.includes("429") ||
        err.message?.includes("quota") ||
        err.message?.includes("RESOURCE_EXHAUSTED");

      if (isQuotaError) {
        console.warn(`Model ${modelName} hết quota, thử model tiếp theo...`);
        continue;
      }

      console.error(`Model ${modelName} lỗi:`, err.message);
      break;
    }
  }

  console.warn("Tất cả model đều hết quota, giữ nguyên thứ tự");
  return contentWords;
}

exports.analyzeSign = async (req, res) => {
  try {
    const { sentence } = req.body;

    if (
      !sentence ||
      typeof sentence !== "string" ||
      sentence.trim().length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp câu cần phân tích",
      });
    }

    if (sentence.trim().length > 500) {
      return res.status(400).json({
        success: false,
        message: "Câu quá dài, vui lòng nhập tối đa 500 ký tự",
      });
    }

    const { contentWords, removedWords } = extractContentWords(sentence.trim());
    const signSequence = await reorderWithGemini(contentWords);

    const wordResults = await Promise.all(
      signSequence.map(async (word) => {
        const found = await Word.findOne({
          name: { $regex: `^${escapeRegex(word)}$`, $options: "i" },
        }).populate("topicId");

        return {
          word,
          found: !!found,
          data: found || null,
        };
      }),
    );

    res.status(200).json({
      success: true,
      data: {
        originalSentence: sentence.trim(),
        removedWords,
        signSequence,
        words: wordResults,
      },
    });
  } catch (error) {
    console.error("analyzeSign error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ nội bộ",
      error: error.message,
    });
  }
};
