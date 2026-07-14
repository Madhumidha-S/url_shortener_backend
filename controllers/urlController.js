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



  try {
    let { longURL } = req.body;
    if (!longURL) {
      return res
        .status(400)
        .json({ error: "longURL is required in the request body" });
    }

    if (!/^https?:\/\//i.test(longURL)) {
      longURL = 'http://' + longURL;
    }

    let result = await db.query(
      `UPDATE url_counter SET num_value = num_value + 1, updated_at = $1 RETURNING num_value`,
      [new Date()]
    );
    
    let num;
    if (result.rows.length === 0) {
      result = await db.query(
        `INSERT INTO url_counter (num_value, updated_at) VALUES (1, $1) RETURNING num_value`,
        [new Date()]
      );
    }
    num = Number(result.rows[0].num_value);

    const shortID = encode(num);
    const shortenedURL = `${process.env.BASE_URL}/${shortID}`;
    logger.info(
      `Generated Short ID: ${shortID}, ShortURL: ${shortenedURL}, LongURL: ${longURL}`
    );
    await db.query(
      `INSERT INTO urls (short_id, long_url, created_at) VALUES ($1, $2, $3)`,
      [shortID, longURL, new Date()]
    );

    res.status(200).json({
      longURL,
      shortenedURL,
      shortID,
    });
  } catch (error) {
    next(error);
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
    await db.query(`DELETE FROM analytics WHERE short_id = $1`, [delete_id]);
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
  }
};

exports.getAnalytics = async (req, res, next) => {
  try {
    const { shortID } = req.params;
    const urlResult = await db.query(
      `SELECT long_url FROM urls WHERE short_id = $1`,
      [shortID]
    );

    if (urlResult.rows.length === 0) {
      return res.status(404).json({ error: "Short URL not found" });
    }

    const analyticsQuery = `SELECT * FROM analytics WHERE short_id = $1 ORDER BY accessed_at DESC`;
    const { rows: analyticsData } = await db.query(analyticsQuery, [shortID]);

    res.json({
      url: urlResult.rows[0],
      stats: analyticsData,
    });
    logger.info("URL analytics fetched successfully");
  } catch (error) {
    next(error);
  }
};

exports.getHistory = async (req, res, next) => {
  try {
    const query = `SELECT * FROM urls ORDER BY created_at DESC`;
    const { rows: data } = await db.query(query);
    res.json(data);
    logger.info("URL history fetched successfully");
  } catch (error) {
    next(error);
  }
};
