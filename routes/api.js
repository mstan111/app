// Assistance provided by ChatGPT in creating the video upload and transcoding logic.
const express = require("express");
const router = express.Router();
const auth = require("../auth.js");
const path = require("path");
const ffmpeg = require('fluent-ffmpeg');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

// Setup lowdb for video metadata storage
const adapter = new FileSync('db.json');
const db = low(adapter);

// Initialize database defaults if empty
db.defaults({ videos: [] }).write();

// User needs to login to obtain an authentication token
router.post("/login", (req, res) => {
    const { username, password } = req.body;
    const token = auth.generateAccessToken(username, password);
    if (!token) {
        return res.sendStatus(403); // Unauthorized
    }
    res.json({ authToken: token }); // Send token back to the client
});

// Upload route for handling file uploads and updating progress
router.post("/upload", auth.authenticateToken, (req, res) => {
    const file = req.files.uploadFile;

    if (!file) {
        return res.status(400).send("No file was uploaded.");
    }

    const uploadPath = path.join(__dirname, "../uploads", file.name);
    const outputFileName = `transcoded-${path.basename(uploadPath, path.extname(uploadPath))}.mp4`;
    const outputPath = path.join(__dirname, "../uploads", outputFileName);

    file.mv(uploadPath, (err) => {
        if (err) {
            return res.status(500).send(err.message);
        }

        // Initialize video object in DB
        const video = {
            user: req.user.username,
            originalFile: file.name,
            transcodedFile: outputFileName,
            progress: 0,
            uploadDate: new Date().toISOString()
        };
        db.get('videos').push(video).write();

        // Start transcoding process and update progress in the DB
        ffmpeg(uploadPath)
            .output(outputPath)
            .on('progress', (progress) => {
                const percent = Math.round(progress.percent || 0);
                console.log(percent);
                db.get('videos')
                    .find({ transcodedFile: outputFileName })
                    .assign({ progress: percent })
                    .write();
            })
            .on('end', () => {
                db.get('videos')
                    .find({ transcodedFile: outputFileName })
                    .assign({ progress: 100 })
                    .write();
                res.json({
                    message: "File uploaded and transcoded successfully",
                    transcodedFile: outputFileName
                });
            })
            .on('error', (err) => {
                console.error("Transcoding failed:", err);
                res.status(500).send("Transcoding failed.");
            })
            .run();
    });
});

// Endpoint to display user's videos
router.get("/myVideos", auth.authenticateToken, (req, res) => {
    const userVideos = db.get('videos').filter({ user: req.user.username }).value();

    if (!userVideos || userVideos.length === 0) {
        return res.status(404).json({ message: "No videos found for this user." });
    }

    res.json(userVideos); // Return the list of videos to the user
});

// Route to download the transcoded video
router.get('/download/:fileName', auth.authenticateToken, (req, res) => {
    const { fileName } = req.params;
    const video = db.get('videos')
        .find({ transcodedFile: fileName, user: req.user.username }) // Ensure ownership
        .value();

    if (!video) {
        return res.status(404).send("Video not found or you don't have access to it.");
    }

    const filePath = path.join(__dirname, '../uploads', video.transcodedFile);
    res.download(filePath, fileName, (err) => {
        if (err) {
            console.error("Error sending file:", err);
            return res.status(500).send("Error downloading file.");
        }
    });
});

// Endpoint to return transcoding progress
router.get("/transcode-progress/:fileName", auth.authenticateToken, (req, res) => {
    const { fileName } = req.params;
    const video = db.get('videos').find({ transcodedFile: fileName }).value();

    if (!video) {
        return res.status(404).json({ message: "Video not found" });
    }

    // Return progress percentage
    res.json({ progress: video.progress || 0 });
});

module.exports = router;