# Local Host Server

Simple Flask server to host your website on your home network.

## Setup

1. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Run the server:
   ```
   python server.py
   ```

3. Access from any device on your network using the IP address shown in the console.

## Future API Routes

To add API endpoints, simply add routes to `server.py`:

```python
@app.route('/api/example', methods=['GET'])
def example_api():
    return {'message': 'Hello from API'}
```

