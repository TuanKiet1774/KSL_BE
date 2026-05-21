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
Nhận mảng từ tiếng Việt đã được lọc sẵn, sắp xếp lại đúng cấu trúc NNKH.

=== QUY TẮC SẮP XẾP ===

1. CHỦ THỂ (ai làm) → đứng đầu tiên
   - Đại từ nhân xưng: tôi, bạn, anh, chị, em, cậu, họ, chúng tôi...
   - Tên người, danh xưng cụ thể
   Ví dụ: "tôi", "anh Nam", "cô giáo"

2. BỐI CẢNH THỜI GIAN → đứng sau chủ thể
   - Từ chỉ thời gian: hôm nay, hôm qua, sáng, tối, năm ngoái...

3. BỐI CẢNH ĐỊA ĐIỂM → đứng sau thời gian
   - Từ chỉ nơi chốn: trường, nhà, công viên, siêu thị...

4. ĐỐI TƯỢNG / DANH TỪ → đứng trước hành động
   - Số lượng đặt NGAY SAU danh từ liên quan

5. TÍNH TỪ MÔ TẢ → đứng NGAY SAU danh từ nó bổ nghĩa
   - Màu sắc, kích thước, trạng thái...

6. HÀNH ĐỘNG / ĐỘNG TỪ → đứng cuối

7. CÂU HỎI → từ để hỏi đặt CUỐI câu
   - ai, gì, ở đâu, khi nào, bao nhiêu, như thế nào...

=== XỬ LÝ TÊN RIÊNG CỦA NGƯỜI ===

Nhận biết tên riêng: từ viết hoa đầu chữ, là tên người Việt Nam (họ tên).

Quy tắc tách chữ cái:
- Tách từng chữ cái của tên thành các phần tử riêng biệt trong mảng
- Dấu thanh điệu tách riêng thành 1 phần tử ở CUỐI tên:
  * Không dấu → không thêm gì
  * Dấu sắc (á, é, ó...) → thêm "sắc"
  * Dấu huyền (à, è, ò...) → thêm "huyền"
  * Dấu hỏi (ả, ẻ, ỏ...) → thêm "hỏi"
  * Dấu ngã (ã, ẽ, õ...) → thêm "ngã"
  * Dấu nặng (ạ, ẹ, ọ...) → thêm "nặng"
- Chữ cái viết IN HOA, bỏ dấu thanh trên chữ cái (ê → Ê, ă → Ă, ơ → Ơ...)

Quy tắc họ tên đầy đủ:
- Nếu là tên đầy đủ (2-3 từ): chỉ lấy tên chính (từ cuối cùng) để ký hiệu
- Tên chính = từ cuối cùng trong họ tên
  * "Nam" → tên chính là "Nam"
  * "Tuấn Kiệt" → tên chính là "Kiệt"  
  * "Phạm Tuấn Kiệt" → tên chính là "Kiệt"

Ví dụ tách tên:
- "Nam" → ["N", "A", "M"]
- "Kiệt" → ["K", "I", "Ê", "T", "nặng"]
- "Thái" → ["T", "H", "A", "I", "sắc"]
- "Tuấn" → ["T", "U", "Â", "N", "sắc"]
- "Hòa" → ["H", "O", "A", "huyền"]
- "Phạm Tuấn Kiệt" → tên chính "Kiệt" → ["K", "I", "Ê", "T", "nặng"]
- "anh Kiệt" → giữ "anh", tách "Kiệt" → ["anh", "K", "I", "Ê", "T", "nặng"]

=== GỘP TỪ LIÊN QUAN ===
- Danh từ ghép: "xe" + "đạp" → "xe đạp"
- Động từ ghép: "đi" + "học" → "đi học"
- Cụm danh từ: "thùng" + "sữa" → "thùng sữa"
- KHÔNG gộp nếu hai từ thuộc vai trò khác nhau trong câu

=== VÍ DỤ TỔNG HỢP ===
input:  ["tôi", "mua", "1", "thùng", "sữa"]
output: ["tôi", "thùng sữa", "1", "mua"]

input:  ["tôi", "tên", "Kiệt"]
output: ["tôi", "tên", "K", "I", "Ê", "T", "nặng"]

input:  ["bạn", "tên", "Phạm", "Tuấn", "Kiệt"]
output: ["bạn", "tên", "K", "I", "Ê", "T", "nặng"]

input:  ["anh", "Thái", "đi", "học"]
output: ["T", "H", "A", "I", "sắc", "đi học"]

input:  ["tôi", "gặp", "Nam", "hôm qua", "trường"]
output: ["tôi", "hôm qua", "trường", "N", "A", "M", "gặp"]

input:  ["đi", "học", "xe", "đạp"]
output: ["đi học", "xe đạp"]

input:  ["cậu", "ăn", "bún", "bánh", "mì"]
output: ["cậu", "bún", "bánh mì", "ăn"]

input:  ["bạn", "tên", "gì"]
output: ["bạn", "tên", "gì"]

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
