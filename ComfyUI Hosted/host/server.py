from flask import Flask, send_from_directory, jsonify, request
import socket                                       #Used to get the local IP address.
import os                                           #Used to get the path to the Frontend folder containing the HTML, CSS, and JavaScript files.
import sys                                          #Used to add the Backend-API to the path.

# Add Backend-API to path to import workflow_scanner
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(__file__)), 'Backend-API'))

from workflow_scanner import WorkflowScanner           #Used to scan the workflows.
from workflow_parser import WorkflowParser             #Used to parse workflow requirements.
from model_scanner import ModelScanner                 #Used to scan the models directory.
from config import COMFYUI_WORKFLOWS_DIR, COMFYUI_MODELS_DIR, COMFYUI_MEDIA_DIR  #Used to get the paths to workflows, models, and media.

app = Flask(__name__)                               #Creates a Flask application instance.

# Get the path to the Frontend folder
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'Frontend')

# Initialize workflow scanner
workflow_scanner = WorkflowScanner(COMFYUI_WORKFLOWS_DIR)    #Pass the workflows directory to the workflow scanner.

# Initialize model scanner
model_scanner = ModelScanner(COMFYUI_MODELS_DIR)              #Pass the models directory to the model scanner.

@app.route('/')                                              #This is the route to take when a user puts in the URL in the browser.
def index():
    return send_from_directory(FRONTEND_DIR, 'index.html')   #Sends the index.html file to the client.


#Send a specifc file in the Frontend Dir. So http:10.0.0.193:5213/style.css will send the style.css file to the client, NEEDED for frontend stuff to work.

@app.route('/<path:filename>')
def serve_static(filename):                                        
    return send_from_directory(FRONTEND_DIR, filename)

# API endpoint to get list of workflows
@app.route('/api/workflows', methods=['GET'])                   #This is the route to get the list of workflows.
def get_workflows():
    try:
        workflows = workflow_scanner.scan_workflows()            #Scan the workflows.
        return jsonify(workflows)                                #Return the workflows as a JSON object.
    except Exception as e:
        return jsonify({'error': str(e)}), 500                    #Return the error as a JSON object.

# API endpoint to parse a workflow and get its requirements
@app.route('/api/workflow/<path:filename>', methods=['GET'])     #This is the route to parse a workflow.
def parse_workflow(filename):
    try:
        workflow_path = os.path.join(COMFYUI_WORKFLOWS_DIR, filename)
        if not os.path.exists(workflow_path):
            return jsonify({'error': 'Workflow not found'}), 404
        
        parsed_data = WorkflowParser.parse_workflow_file(workflow_path)  #Parse the workflow.
        return jsonify(parsed_data)                              #Return the parsed data as a JSON object.
    except Exception as e:
        return jsonify({'error': str(e)}), 500                    #Return the error as a JSON object.


# API endpoint to apply user-provided inputs to a workflow and return the modified workflow JSON
@app.route('/api/workflow/<path:filename>/apply', methods=['POST'])
def apply_workflow_inputs(filename):
    try:
        workflow_path = os.path.join(COMFYUI_WORKFLOWS_DIR, filename)
        if not os.path.exists(workflow_path):
            return jsonify({'error': 'Workflow not found'}), 404

        payload = request.get_json(force=True)
        if not payload:
            return jsonify({'error': 'No JSON payload provided'}), 400

        # Expected payload: { inputs: { "{nodeId}_{widgetIndex}": value, ... } }
        inputs_map = payload.get('inputs') or {}

        # Load original workflow
        with open(workflow_path, 'r', encoding='utf-8') as f:
            workflow_data = json.load(f)

        nodes = workflow_data.get('nodes', [])

        # For each node, update widgets_values if provided
        for node in nodes:
            widgets_values = node.get('widgets_values')
            # If node has no widgets_values, skip unless we must create one
            if widgets_values is None:
                widgets_values = []

            # Build a list copy to modify
            new_wv = list(widgets_values)

            # Iterate visible inputs for this node. We need to compute the same
            # visible_index ordering used by the parser: sequential per unlinked visible input.
            visible_index = 0
            wv_index = 0
            inputs = node.get('inputs', []) or []
            for input_field in inputs:
                link = input_field.get('link')
                if link is not None:
                    continue

                # Decide if this input would be shown (heuristic similar to parser)
                widget = input_field.get('widget')
                input_type = (input_field.get('type') or '').upper()
                should_show = widget is not None or any(sub in input_type for sub in ('IMAGE','UPLOAD','TEXT','STRING','PROMPT','FILE','URL','COMBO','BOOLEAN','INT','FLOAT','NUMBER','MASK'))

                if not should_show:
                    continue

                key = f"{node.get('id')}_{visible_index}"
                if key in inputs_map:
                    # Ensure new_wv is large enough. Use wv_index as position if widget existed.
                    # If widget existed at this position, use that index; otherwise append.
                    val = inputs_map[key]
                    if wv_index < len(new_wv):
                        new_wv[wv_index] = val
                    else:
                        new_wv.append(val)

                # advance indices: if input has widget, consume widgets_values index
                if widget is not None:
                    wv_index += 1

                visible_index += 1

            # Assign back if changed
            if new_wv != widgets_values:
                node['widgets_values'] = new_wv

        # Return modified workflow (do not overwrite original file)
        return jsonify({'workflow': workflow_data})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# API endpoint to get list of models organized by folder
@app.route('/api/models', methods=['GET'])                       #This is the route to get the list of models.
def get_models():
    try:
        models_by_folder = model_scanner.scan_models()            #Scan the models directory.
        return jsonify(models_by_folder)                          #Return the models organized by folder.
    except Exception as e:
        return jsonify({'error': str(e)}), 500                    #Return the error as a JSON object.

# API endpoint to list media files (images/videos) from COMFYUI_MEDIA_DIR
@app.route('/api/media', methods=['GET'])
def list_media():
    """List image or video files recursively from the configured COMFYUI_MEDIA_DIR.

    Query parameters:
      - type: 'image' or 'video'

    Returns a JSON list of relative paths (sorted alphabetically).
    """
    try:
        media_root = COMFYUI_MEDIA_DIR
        if not media_root:
            return jsonify({'error': 'COMFYUI_MEDIA_DIR not configured'}), 400

        mtype = (request.args.get('type') or '').lower()
        if mtype not in ('image', 'video'):
            return jsonify({'error': 'type must be image or video'}), 400

        if not os.path.exists(media_root) or not os.path.isdir(media_root):
            return jsonify({'error': 'media directory not found'}), 404

        # Allowed extensions
        image_exts = {'.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.tiff'}
        video_exts = {'.mp4', '.mov', '.avi', '.mkv', '.webm'}

        matches = []
        for dirpath, dirnames, filenames in os.walk(media_root):
            for fn in filenames:
                _, ext = os.path.splitext(fn.lower())
                if mtype == 'image' and ext in image_exts:
                    full = os.path.join(dirpath, fn)
                    rel = os.path.relpath(full, media_root)
                    matches.append(rel.replace('\\', '/'))
                if mtype == 'video' and ext in video_exts:
                    full = os.path.join(dirpath, fn)
                    rel = os.path.relpath(full, media_root)
                    matches.append(rel.replace('\\', '/'))

        matches.sort(key=lambda s: s.lower())
        return jsonify(matches)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/media/<path:relpath>')
def serve_media(relpath):
    """Serve a file from COMFYUI_MEDIA_DIR given a relative path.

    This validates that the resolved path is inside the media root to avoid directory traversal.
    """
    try:
        media_root = COMFYUI_MEDIA_DIR
        if not media_root:
            return jsonify({'error': 'COMFYUI_MEDIA_DIR not configured'}), 400

        # Normalize and prevent traversal
        full = os.path.normpath(os.path.join(media_root, relpath))
        media_root_norm = os.path.normpath(media_root)
        if not full.startswith(media_root_norm):
            return jsonify({'error': 'Invalid path'}), 400

        if not os.path.exists(full) or not os.path.isfile(full):
            return jsonify({'error': 'File not found'}), 404

        # Use send_from_directory to stream file
        directory = os.path.dirname(full)
        filename = os.path.basename(full)
        return send_from_directory(directory, filename)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Get local IP address to host the html locally.
def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]     #Read local IP address of server.
    except Exception:               #If issues with network, then local host only.
        ip = 'localhost'
    finally:
        s.close()
    return ip

if __name__ == '__main__':
    PORT = 5213     #Port to connect to.
    localIP = get_local_ip()        #Gets local IP of server.
    
    print(f"Server running at:")
    print(f"  Local:   http://localhost:{PORT}")       #Local host only.
    print(f"  Network: http://{localIP}:{PORT}")       #Home Network access.
    print(f"\nOther devices can access it at: http://{localIP}:{PORT}")
    print(f"\nPress CTRL+C to stop the server")
    
    # Run on all network interfaces (0.0.0.0) to allow network access
    app.run(host='0.0.0.0', port=PORT, debug=True)

