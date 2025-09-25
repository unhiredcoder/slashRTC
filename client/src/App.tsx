import { useEffect, useState } from "react";
import { Download, Upload, File, Loader2, CheckCircle, XCircle } from "lucide-react";

// Assuming you have a .env file with VITE_API_BASE=your-api-base-url
const API_BASE = import.meta.env.VITE_API_BASE;

interface FileItem {
  name: string;
}

interface Notification {
  message: string;
  type: "success" | "error";
}

function FileListPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);

  // Show a notification and hide it automatically after 3 seconds
  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // Fetch files from the API on component mount
  useEffect(() => {
    const fetchFiles = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/get-files`);
        const data: FileItem[] = await res.json();
        // Reverse the order to show newly uploaded files at the top
        setFiles(data.reverse());
      } catch (err) {
        console.error("Error fetching files", err);
        showNotification("Failed to fetch files.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchFiles();
  }, []);

  // Handle file upload to the API
  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);

    const reader = new FileReader();
    reader.readAsDataURL(selectedFile);
    reader.onloadend = async () => {
      const result = reader.result as string;
      const base64String = result.split(",")[1];
      try {
        const response = await fetch(`${API_BASE}/file-upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: selectedFile.name,
            fileData: base64String,
            contentType: selectedFile.type,
          }),
        });

        if (!response.ok) throw new Error("Upload failed");

        // Optimistically add the new file to the top of the list
        setFiles(prevFiles => [{ name: selectedFile.name }, ...prevFiles]);
        showNotification("File uploaded successfully!", "success");
        setSelectedFile(null);
      } catch (err) {
        showNotification("File upload failed!", "error");
        console.error(err);
      } finally {
        setUploading(false);
      }
    };
  };

  // Handle file download by opening the download URL
  const handleDownload = (file: FileItem) => {
    window.open(`${API_BASE}/download/${encodeURIComponent(file.name)}`, "_blank");
  };

  return (
    <div className="bg-gray-900 min-h-screen py-10 px-4 text-gray-100 relative flex items-center justify-center">
      <div className="w-full max-w-xl mx-auto p-6 sm:p-8 space-y-8 bg-gray-800 rounded-3xl shadow-2xl transition-transform transform hover:scale-[1.01]">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white text-center tracking-wide">
          <File className="inline-block mr-3 text-emerald-400 w-8 h-8 sm:w-10 sm:h-10" />
          File Manager
        </h1>

        {/* Upload Section */}
        <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border border-gray-700 rounded-xl transition-all duration-300 hover:border-emerald-500 hover:shadow-lg">
          <input
            type="file"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            className="flex-grow text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-500 file:text-white hover:file:bg-emerald-600 cursor-pointer"
          />
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className={`flex items-center justify-center w-full sm:w-auto px-6 py-2 rounded-full font-bold transition-all duration-300 transform ${
              !selectedFile || uploading
                ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                : "bg-emerald-500 text-white hover:bg-emerald-600 hover:scale-105"
            }`}
          >
            {uploading ? (
              <span className="flex items-center">
                <Loader2 className="animate-spin mr-3" />
                Uploading...
              </span>
            ) : (
              <>
                <Upload className="mr-2" /> Upload
              </>
            )}
          </button>
        </div>

        {/* File List Section */}
        {loading ? (
          <div className="text-center py-10">
            <Loader2 className="animate-spin h-10 w-10 text-emerald-400 mx-auto" />
            <p className="mt-4 text-gray-400">Fetching files...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-400 text-lg">No files have been uploaded yet.</p>
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto pr-2 custom-scrollbar">
            <ul className="divide-y divide-gray-700">
              {files.map((file, index) => (
                <li
                  key={index}
                  className="flex flex-col sm:flex-row justify-between items-center py-4 px-3 bg-gray-700 hover:bg-gray-600 rounded-xl transition-all duration-200 cursor-pointer mb-2"
                  onClick={() => handleDownload(file)}
                >
                  <span 
                    className="text-lg font-medium text-white break-all truncate w-full"
                    title={file.name}
                  >
                    {file.name}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(file);
                    }}
                    className="mt-2 sm:mt-0 flex items-center bg-emerald-500 text-white px-4 py-2 rounded-full hover:bg-emerald-600 transition-all duration-300 transform hover:scale-105"
                  >
                    <Download className="mr-2" /> Download
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Pop-up Notification */}
      {notification && (
        <div className={`fixed bottom-5 left-1/2 -translate-x-1/2 mx-4 p-4 rounded-xl shadow-lg flex items-center space-x-3 transition-transform duration-300 transform ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white z-50 animate-slide-in`}>
          {notification.type === "success" ? (
            <CheckCircle className="w-6 h-6" />
          ) : (
            <XCircle className="w-6 h-6" />
          )}
          <span>{notification.message}</span>
        </div>
      )}
    </div>
  );
}

export default FileListPage;