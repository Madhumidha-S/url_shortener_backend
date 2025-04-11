const fs = require("fs");
const path = require("path");

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

exports.generateURL = async (req, res, next) => {
  try {
    const filePath = path.join(__dirname, "Value.txt");

    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) throw err;
      let num = parseInt(data);
      num = num + 1;

      const shortID = encode(num);
      console.log(`Generated Short ID: ${shortID} for Value ${num}`);

      fs.writeFile(filePath, num.toString(), (err) => {
        if (err) throw err;

        res.status(200).json({
          shortID,
          num,
        });
      });
    });
  } catch (error) {
    next(error);
    res.status(500).json({ error: "Failed to generate QR code" });
  }
};
