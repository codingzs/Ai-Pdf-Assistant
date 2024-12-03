import os
from flask import Flask, request, jsonify, render_template, send_from_directory
from werkzeug.utils import secure_filename
import PyPDF2
import google.generativeai as genai

app = Flask(__name__, static_folder='static')
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max-limit

# Configure Gemini API
genai.configure(api_key='AIzaSyCQqKjywYl__FSRGHBqofydC3emmtfSitQ')
model = genai.GenerativeModel('gemini-pro')

# Global variables to store PDF content and chat history
pdf_content = ""
chat_history = []

def extract_text_from_pdf(file_path):
    with open(file_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        text = ""
        for page in reader.pages:
            text += page.extract_text()
    return text

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

@app.route('/upload', methods=['POST'])
def upload_file():
    global pdf_content
    if 'pdf-file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['pdf-file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file and file.filename.lower().endswith('.pdf'):
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        pdf_content = extract_text_from_pdf(file_path)
        os.remove(file_path)  # Remove the file after extracting text
        return jsonify({'message': 'File uploaded successfully'}), 200
    else:
        return jsonify({'error': 'Invalid file type'}), 400

@app.route('/chat', methods=['POST'])
def chat():
    global chat_history
    question = request.json['question']
    
    # Prepare the prompt with chat history and new question
    prompt = f"PDF Content: {pdf_content}\n\nChat History:\n"
    for entry in chat_history:
        prompt += f"{entry['role']}: {entry['content']}\n"
    prompt += f"Human: {question}\nAI:"

    # Generate response using Gemini API
    response = model.generate_content(prompt)
    answer = response.text

    # Update chat history
    chat_history.append({'role': 'Human', 'content': question})
    chat_history.append({'role': 'AI', 'content': answer})

    # Keep only the last 5 exchanges to manage context window
    if len(chat_history) > 10:
        chat_history = chat_history[-10:]

    return jsonify({'answer': answer})

if __name__ == '__main__':
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    app.run(debug=True, port=5000,host='0.0.0.0')