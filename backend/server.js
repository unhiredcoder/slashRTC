const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const uri = process.env.MONGO_URI;
const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL, 
  credentials: true,
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));


mongoose.connect(uri).then(() => console.log("connected to database"));

const FileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  data: { type: Buffer, required: true },
  contentType: { type: String, required: true },
});

const FileModel = mongoose.model("File", FileSchema);

// Upload endpoint
app.post("/file-upload", async (req, res) => {
  try {
    const { name, fileData, contentType } = req.body;
    const buffer = Buffer.from(fileData, "base64");

    const newFile = new FileModel({
      name,
      data: buffer,
      contentType: contentType || "application/octet-stream",
    });

    await newFile.save();

    res.json({ success: true, message: "File uploaded successfully" });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ success: false, message: "Something went wrong." });
  }
});

// List files (with base64)
app.get("/get-files", async (req, res) => {
  try {
    const files = await FileModel.find().select("name data contentType");

    const formattedFiles = files.map((file) => ({
      name: file.name,
      data: file.data.toString("base64"),
      contentType: file.contentType,
    }));

    res.json(formattedFiles);
  } catch (error) {
    console.error("Error fetching files:", error);
    res.status(500).json({ message: "Error fetching files" });
  }
});

// Download endpoint
app.get("/download/:name", async (req, res) => {
  try {
    const file = await FileModel.findOne({ name: req.params.name });
    if (!file) {
      return res.status(404).send("File not found");
    }
    res.set({
      "Content-Type": file.contentType,
      "Content-Disposition": `attachment; filename="${file.name}"`,
    });
    res.send(file.data);
  } catch (error) {
    res.status(500).send("Error downloading file");
  }
});

app.listen(5000, () => {
  console.log("listening on port 5000");
});
