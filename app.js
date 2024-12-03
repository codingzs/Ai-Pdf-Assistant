const { useState, useRef, useEffect } = React;
const { motion, AnimatePresence } = window.Motion;

function PDFChatBot() {
  const [pdfUploaded, setPdfUploaded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files.length) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file) => {
    const formData = new FormData();
    formData.append('pdf-file', file);

    try {
      const response = await fetch('/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setPdfUploaded(true);
        setMessages([{ role: 'system', content: 'PDF uploaded successfully. You can now ask questions about its content.' }]);
      } else {
        alert('Error uploading PDF');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error uploading PDF');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, newMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: input }),
      });

      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'ai', content: data.answer }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [...prev, { role: 'system', content: 'Error: Unable to get response' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">PDF Chat Bot</h1>
      {!pdfUploaded ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="border-4 border-dashed border-gray-300 rounded-lg p-8 text-center"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileUpload(e.target.files[0])}
            className="hidden"
            accept=".pdf"
          />
          <button
            onClick={() => fileInputRef.current.click()}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out transform hover:scale-105"
          >
            Choose PDF File
          </button>
          <p className="mt-4 text-gray-600">or drag and drop your PDF here</p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-lg shadow-lg p-6"
        >
          <div ref={chatContainerRef} className="h-96 overflow-y-auto mb-4 p-4 bg-gray-100 rounded">
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`mb-4 ${
                    message.role === 'user'
                      ? 'text-right'
                      : message.role === 'ai'
                      ? 'text-left'
                      : 'text-center text-gray-500 italic'
                  }`}
                >
                  <span
                    className={`inline-block p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : message.role === 'ai'
                        ? 'bg-gray-300 text-gray-800'
                        : ''
                    }`}
                  >
                    {message.content}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center"
              >
                <div className="inline-block animate-pulse">
                  <span className="inline-block w-2 h-2 bg-gray-500 rounded-full mr-1"></span>
                  <span className="inline-block w-2 h-2 bg-gray-500 rounded-full mr-1 animate-pulse delay-75"></span>
                  <span className="inline-block w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-150"></span>
                </div>
              </motion.div>
            )}
          </div>
          <form onSubmit={handleSubmit} className="flex">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-grow mr-2 p-2 border border-gray-300 rounded"
              placeholder="Ask a question..."
            />
            <button
              type="submit"
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out transform hover:scale-105"
            >
              Send
            </button>
          </form>
        </motion.div>
      )}
    </div>
  );
}

ReactDOM.render(<PDFChatBot />, document.getElementById('root'));