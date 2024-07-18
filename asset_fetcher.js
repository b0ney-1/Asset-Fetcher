const fs = require("fs");
const axios = require("axios");
const crypto = require("crypto");
const path = require("path");

const MAX_RETRIES = 3; // Maximum number of retries
const RETRY_DELAY = 5000; // Delay between retries in milliseconds

// Function to generate a hexadecimal string from a secret
const generateHex = (secret, index) => {
  const hash = crypto.createHash("sha256");
  hash.update(secret + index);
  return hash.digest("hex").slice(0, 8); // Use the first 8 characters for shorter hex values
};

// Function to download an image based on a hex value with retry mechanism and detailed logging
const downloadImageWithRetry = async (hexValue, directory, index) => {
  const url = `https://charactergenlitev2.onrender.com/v1/card/seed/${hexValue}/1x.png`;
  const imagePath = path.join(directory, `${hexValue}.png`);

  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      console.log(`Downloading image for hex value: ${hexValue}`);
      const response = await axios({
        url: url,
        method: "GET",
        responseType: "stream",
      });

      const writer = fs.createWriteStream(imagePath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", () => {
          console.log(`Image downloaded successfully: ${hexValue}`);
          resolve();
        });
        writer.on("error", reject);
      });

      return;
    } catch (error) {
      console.error(
        `Failed to download image for ${hexValue}: ${error.message}`
      );
      retries++;
      console.log(`Retrying (${retries}/${MAX_RETRIES})...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY)); // Wait before retrying
    }
  }

  console.error(
    `Failed to download image for ${hexValue} after ${MAX_RETRIES} retries.`
  );
};

// Function to create directory if not exists
const createDirectoryIfNotExists = (directory) => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory);
  }
};

// Main function to generate hex values, download images with retry and logging, and save them to a directory
const main = async () => {
  const secret = "your_secret_here"; // Replace with the user's secret
  const directory = path.join(__dirname, "downloaded_images");

  createDirectoryIfNotExists(directory);

  for (let i = 0; i < 10000; i++) {
    const hexValue = generateHex(secret, i);
    console.log(`Process ${i + 1}/10000: Generating hex value ${hexValue}`);
    await downloadImageWithRetry(hexValue, directory, i + 1);
  }

  console.log("All images downloaded successfully!");
};

// Run the main function
main();
