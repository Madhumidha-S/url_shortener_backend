require("dotenv").config();
const logger = require("../utils/logger");
const db = require("../utils/database");

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
    const result = await db.query(`SELECT num_value FROM url_counter`);
    let num = Number(result.rows[0]?.num_value);

    num = num + 1;
    const shortID = encode(num);
    const shortenedURL = `${process.env.BASE_URL}/${shortID}`;
    logger.info(
      `Generated Short ID: ${shortID}, ShortURL: ${shortenedURL}, LongURL: ${longURL}`
    );
    await db.query(
      `INSERT INTO urls (short_id, long_url, created_at) VALUES ($1, $2, $3)`,
      [shortID, longURL, new Date()]
    );

    await db.query(`UPDATE url_counter SET num_value = $1, updated_at = $2`, [
      num,
      new Date(),
    ]);

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
    const { delete_id } = req.params;
    if (!delete_id)
      return res.status(400).json({ error: "ID Parameter is required" });
    const result = await db.query(`SELECT * FROM urls WHERE short_id = $1`, [
      delete_id,
    ]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: "URL not found" });
    }
    logger.info(`Deleted Short ID: ${delete_id}`);
    await db.query(`DELETE FROM urls WHERE short_id = $1`, [delete_id]);
    const { id, short_id, long_url } = result.rows[0];
    res.status(200).json({
      message: "URL deleted successfully",
      deleted: {
        id,
        short_id,
        long_url,
      },
    });
  } catch (error) {
    next(error);
    res.status(500).json({ error: "Failed to delete URL" });
  }
};
