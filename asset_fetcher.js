const fs = require("fs");
const axios = require("axios");
const crypto = require("crypto");
const path = require("path");
const { SingleBar } = require("cli-progress");

const MAX_CONCURRENT_DOWNLOADS = 10; // Increase concurrent downloads

// Function to generate a hexadecimal string from a secret
const generateHex = (secret, index) => {
  const hash = crypto.createHash("sha256");
  hash.update(secret + index);
  return hash.digest("hex").slice(0, 8); // Use the first 8 characters for shorter hex values
};

// Function to download an image based on a hex value
const downloadImage = async (hexValue, directory, progress) => {
  const url = `https://charactergenlitev2.onrender.com/v1/card/seed/${hexValue}/1x.png`;
  const imagePath = path.join(directory, `${hexValue}.png`);

  try {
    const response = await axios({
      url: url,
      method: "GET",
      responseType: "stream",
    });

    const writer = fs.createWriteStream(imagePath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    progress.increment(); // Increment progress bar
  } catch (error) {
    console.error(`Failed to download image for ${hexValue}: ${error.message}`);
  }
};

// Function to create directory if not exists
const createDirectoryIfNotExists = (directory) => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory);
  }
};

// Main function to generate hex values, download images concurrently, and save them to a directory
const main = async () => {
  const secret = "your_secret_here"; // Replace with the user's secret
  const directory = path.join(__dirname, "downloaded_images");

  createDirectoryIfNotExists(directory);

  const totalImagesToGenerate = 10000;
  let totalImagesDownloaded = 0;
  let concurrentDownloads = 0;

  // Create a new progress bar instance
  const progressBar = new SingleBar({
    format: "Downloading Images [{bar}] {percentage}% | {value}/{total}",
    barCompleteChar: "\u2588",
    barIncompleteChar: "\u2591",
    hideCursor: true,
  });

  progressBar.start(totalImagesToGenerate, 0); // Initialize progress bar

  for (let i = 0; i < totalImagesToGenerate; i++) {
    const hexValue = generateHex(secret, i);
    concurrentDownloads++;

    downloadImage(hexValue, directory, progressBar).then(() => {
      totalImagesDownloaded++;
      concurrentDownloads--;

      if (totalImagesDownloaded === totalImagesToGenerate) {
        progressBar.stop();
        console.log("All images downloaded successfully!");
      }
    });

    // Control concurrency
    if (concurrentDownloads >= MAX_CONCURRENT_DOWNLOADS) {
      await new Promise((resolve) => setTimeout(resolve, 10)); // Control the rate of making requests
    }
  }
};

// Run the main function
main();
