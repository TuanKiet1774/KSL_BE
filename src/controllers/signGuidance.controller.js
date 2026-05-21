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
  "gemini-3.1-flash-lite", // 15 RPM - ưu tiên nhất
  "gemma-4-26b-it", // 15 RPM
  "gemma-4-31b-it", // 15 RPM
  "gemini-2.5-flash-lite", // 10 RPM
  "gemini-2.5-flash", // 5 RPM
  "gemini-3.5-flash", // 5 RPM
  "gemini-3-flash", // 5 RPM
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

// Thêm sau hàm escapeRegex
const TONE_MARKS = ["sắc", "huyền", "hỏi", "ngã", "nặng"];
const SINGLE_LETTERS = /^[A-ZĂÂÊÔƠƯĐ]$/i;

function getDisplayWord(word) {
  // Dấu thanh → "Dấu sắc", "Dấu nặng"...
  if (TONE_MARKS.includes(word.toLowerCase())) {
    return "Dấu " + word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }
  // Chữ cái đơn → "Chữ A", "Chữ K"...
  if (SINGLE_LETTERS.test(word)) {
    return "Chữ " + word.toUpperCase();
  }
  // Từ thường → giữ nguyên
  return word;
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

const prompt = `Bạn là chuyên gia ngôn ngữ ký hiệu tiếng Việt (NNKH).
Nhận mảng từ tiếng Việt đã được lọc sẵn, xử lý lại theo cấu trúc NNKH.

=== NGUYÊN TẮC CHÍNH ===
Ngôn ngữ ký hiệu tiếng Việt GIỮ NGUYÊN thứ tự từ như tiếng Việt thông thường.
KHÔNG đảo thứ tự từ. Chỉ gộp từ liên quan và xử lý tên riêng/câu chào.

=== GỘP TỪ LIÊN QUAN (giữ vị trí trong câu) ===
- Danh từ ghép: "xe" + "đạp" → "xe đạp"
- Động từ ghép: "đi" + "học" → "đi học"
- Cụm danh từ: "thùng" + "sữa" → "thùng sữa"
- Số lượng + danh từ: "1" + "thùng sữa" → giữ nguyên thứ tự trong câu
- KHÔNG gộp nếu hai từ thuộc vai trò khác nhau trong câu

=== XỬ LÝ CÂU CHÀO ===
Các từ/cụm sau đây đều mang nghĩa chào hỏi, quy về "xin chào":
- "xin chào", "chào", "hello", "hi", "hey"
- "hân hạnh được gặp", "rất vui được gặp", "vui được gặp"

Ví dụ:
- ["chào", "bạn"] → ["xin chào", "bạn"]
- ["hello", "tôi", "tên", "Nam"] → ["xin chào", "tôi", "tên", "N", "A", "M"]

=== XỬ LÝ TÊN RIÊNG CỦA NGƯỜI ===
Nhận biết tên riêng: từ viết hoa đầu chữ, là tên người Việt Nam.

Quy tắc tách chữ cái:
- Tách từng chữ cái thành phần tử riêng biệt
- Dấu thanh tách riêng thành 1 phần tử ở CUỐI:
  * Dấu sắc → thêm "sắc"
  * Dấu huyền → thêm "huyền"
  * Dấu hỏi → thêm "hỏi"
  * Dấu ngã → thêm "ngã"
  * Dấu nặng → thêm "nặng"
  * Không dấu → không thêm gì
- Chữ cái viết IN HOA, bỏ dấu thanh (ê → Ê, ă → Ă, ơ → Ơ...)

Quy tắc họ tên đầy đủ:
- Chỉ lấy tên chính (từ cuối cùng) để ký hiệu
  * "Phạm Tuấn Kiệt" → tên chính "Kiệt" → ["K", "I", "Ê", "T", "nặng"]
  * "Trần Thái" → tên chính "Thái" → ["T", "H", "A", "I", "sắc"]

=== VÍ DỤ TỔNG HỢP ===
input:  ["tôi", "mua", "1", "thùng", "sữa"]
output: ["tôi", "mua", "1", "thùng sữa"]

input:  ["tôi", "tên", "Kiệt"]
output: ["tôi", "tên", "K", "I", "Ê", "T", "nặng"]

input:  ["bạn", "tên", "Phạm", "Tuấn", "Kiệt"]
output: ["bạn", "tên", "K", "I", "Ê", "T", "nặng"]

input:  ["anh", "Thái", "đi", "học"]
output: ["anh", "T", "H", "A", "I", "sắc", "đi học"]

input:  ["tôi", "gặp", "Nam", "hôm qua", "trường"]
output: ["tôi", "gặp", "N", "A", "M", "hôm qua", "trường"]

input:  ["đi", "học", "xe", "đạp"]
output: ["đi học", "xe đạp"]

input:  ["cậu", "ăn", "bún", "bánh", "mì"]
output: ["cậu", "ăn", "bún", "bánh mì"]

input:  ["bạn", "tên", "gì"]
output: ["bạn", "tên", "gì"]

input:  ["chào", "bạn", "khỏe"]
output: ["xin chào", "bạn", "khỏe"]

input:  ["trời", "mưa", "tôi", "đi", "học"]
output: ["trời", "mưa", "tôi", "đi học"]

input:  ["anh", "em", "đi", "chơi"]
output: ["anh", "em", "đi chơi"]

Chỉ trả về JSON array, KHÔNG có markdown, KHÔNG giải thích.
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
        const displayWord = getDisplayWord(word);

        let found = await Word.findOne({
          name: { $regex: `^${escapeRegex(displayWord)}$`, $options: "i" },
        }).populate("topicId");

        if (!found && displayWord !== word) {
          found = await Word.findOne({
            name: { $regex: `^${escapeRegex(word)}$`, $options: "i" },
          }).populate("topicId");
        }

        return {
          word,
          displayWord,
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
