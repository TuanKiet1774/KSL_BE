const Word = require("../models/Word");
const { Gioi_tu, Lien_tu, Tu_tinhthai, Tro_tu } = require("./typeWord.controller");

const ALL_STOP_WORDS = [...Gioi_tu, ...Lien_tu, ...Tu_tinhthai, ...Tro_tu]
  .map((w) => w.toLowerCase())
  .sort((a, b) => b.split(" ").length - a.split(" ").length || b.length - a.length);

const MAX_PHRASE_LEN = Math.max(...ALL_STOP_WORDS.map((w) => w.split(" ").length));

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
    for (let len = Math.min(MAX_PHRASE_LEN, tokens.length - i); len >= 1; len--) {
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

exports.analyzeSign = async (req, res) => {
  try {
    const { sentence } = req.body;

    if (!sentence || typeof sentence !== "string" || sentence.trim().length === 0) {
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

    const wordResults = await Promise.all(
      contentWords.map(async (word) => {
        const found = await Word.findOne({
          name: { $regex: `^${escapeRegex(word)}$`, $options: "i" },
        }).populate("topicId");

        return {
          word,
          found: !!found,
          data: found || null,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        originalSentence: sentence.trim(),
        removedWords,
        words: wordResults,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ nội bộ",
      error: error.message,
    });
  }
};
