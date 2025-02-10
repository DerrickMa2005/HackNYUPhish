from flask import Flask, request, jsonify, Response, send_from_directory
from flask_cors import CORS
import json
import time
import os  # Import the os module

# Import from your model.py (adjust the path as needed)
from model import generate_emails_for_difficulty, NUM_EMAILS_PER_DIFFICULTY

app = Flask(__name__, static_folder='static')

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

app = Flask(__name__, static_folder='static')  # Set the static folder
CORS(app)

@app.route('/generate_emails', methods=['GET'])
def generate_emails():
    difficulty = request.args.get('difficulty', 'phishnoob')
    try:
        emails = generate_emails_for_difficulty(difficulty, NUM_EMAILS_PER_DIFFICULTY)
        return jsonify(emails), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# NEW: Streaming endpoint using Server-Sent Events (SSE)
@app.route('/generate_emails_stream', methods=['GET'])
def generate_emails_stream():
    difficulty = request.args.get('difficulty', 'phishnoob')

    def generate():
        # Call your generator function. Since generate_emails_for_difficulty
        # currently returns a list, iterate over it. To truly stream, consider
        # modifying your model to yield as each email is ready.
        emails = generate_emails_for_difficulty(difficulty, NUM_EMAILS_PER_DIFFICULTY)
        for email in emails:
            yield f"data: {json.dumps(email)}\n\n"
            # Optional: small delay if needed
            time.sleep(0.5)
    return Response(generate(), mimetype='text/event-stream')

# Serve static files
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)