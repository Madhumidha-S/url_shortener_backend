require("dotenv").config();
const logger = require("../utils/logger");
const db = require("../utils/database");

let num = 10000000000000;

exports.generateURL = async (req, res, next) => {
  const characters =
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const base = characters.length;

  function encode(num) {
    let encoded = "";
    while (num > 0) {
      encoded = characters[num % base] + encoded;
      num = Math.floor(num / base);
    }
    return encoded || "0";
  }

  // function decode(str) {
  //   let decoded = 0;
  //   for (let i = 0; i < str.length; i++) {
  //     decoded = decoded * base + characters.indexOf(str[i]);
  //   }
  //   return decoded;
  // }

  try {
    const { longURL } = req.body;
    if (!longURL) {
      return res
        .status(400)
        .json({ error: "longURL is required in the request body" });
    }
    num = num + 1;
    const shortID = encode(num);
    const shortenedURL = `${process.env.BASE_URL}/${shortID}`;
    logger.info(
      `Generated Short ID: ${shortID} for Value ${num} and ShortURL: ${shortenedURL}, LongURL: ${longURL}`
    );
    const query = `
      INSERT INTO urls (short_id, long_url, created_at)
      VALUES ($1, $2, $3)
    `;
    await db.query(query, [shortID, longURL, new Date()]);

    res.status(200).json({
      longURL,
      shortenedURL,
      shortID,
    });
  } catch (error) {
    next(error);
    res.status(500).json({ error: "Failed to generate Shortened URL" });
  }
};

exports.deleteURL = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "ID Parameter is required" });
    const result = await db.query(`SELECT * FROM urls WHERE id = $1`, [id]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: "URL not found" });
    }
    await db.query(`DELETE FROM urls WHERE id = $1`, [id]);
    res
      .status(200)
      .json({ message: "URL deleted successfully", deleted: result.rows[0] });
  } catch (error) {
    next(error);
    res.status(500).json({ error: "Failed to delete URL" });
  }
};
