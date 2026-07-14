require("dotenv").config();
const app = require("./app");
const { errorHandler } = require("./middleware");
const PORT = process.env.PORT || 3000;

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "The requested resource was not found",
    },
  });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}.`);
});
