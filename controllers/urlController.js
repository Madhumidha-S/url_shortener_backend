require("dotenv").config();

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

  function decode(str) {
    let decoded = 0;
    for (let i = 0; i < str.length; i++) {
      decoded = decoded * base + characters.indexOf(str[i]);
    }
    return decoded;
  }

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
    console.log(
      `Generated Short ID: ${shortID} for Value ${num} and ShortURL: ${shortenedURL}, LongURL: ${longURL}`
    );
    res.status(200).json({
      longURL,
      shortenedURL,
      shortID,
      num,
    });
  } catch (error) {
    next(error);
    res.status(500).json({ error: "Failed to generate Shortened URL" });
  }
};
