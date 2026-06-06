from app import create_app
import os

app = create_app()

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5001))
    # Flask default is 5000, but I'll use 5001 to stay consistent with the previous fix
    app.run(host='0.0.0.0', port=port, debug=True)
